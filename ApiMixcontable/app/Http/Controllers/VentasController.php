<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Models\Cheque;

class VentasController extends Controller
{
    private function extraerUsuarioEliminacionDesdeObservaciones($observaciones)
    {
        if (empty($observaciones)) return null;
        $obs = (string) $observaciones;

        // Formato que escribimos al eliminar: "ELIMINADO_POR:<id> | <nombre>"
        if (preg_match('/ELIMINADO_POR\s*:\s*([^\|\n]+)\|\s*([^\n]+)/u', $obs, $m)) {
            $nombre = trim($m[2] ?? '');
            return $nombre !== '' ? $nombre : null;
        }

        // Formato alternativo
        if (preg_match('/ELIMINADO_POR_NOMBRE\s*:\s*([^\n]+)/u', $obs, $m)) {
            $nombre = trim($m[1] ?? '');
            return $nombre !== '' ? $nombre : null;
        }

        return null;
    }

    private function ventaMetodoPrincipalEsCheque($metodosPagoDetalle, $metodosPagoString, $data): bool
    {
        try {
            $tipoRaw = null;
            if (is_array($metodosPagoDetalle) && !empty($metodosPagoDetalle[0]['tipo'])) {
                $tipoRaw = strtolower(trim((string)$metodosPagoDetalle[0]['tipo']));
            } elseif (!empty($data['metodo_pago'])) {
                $tipoRaw = strtolower(trim((string)$data['metodo_pago']));
            } elseif (!empty($metodosPagoString)) {
                $tipoRaw = strtolower(trim((string)$metodosPagoString));
            }
            return $tipoRaw && (strpos($tipoRaw, 'cheque') !== false);
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function extraerVentaIdDesdeObservacionesCheque($obs)
    {
        if (empty($obs)) return null;
        if (preg_match('/VENTA_ID\s*:\s*(\d+)/i', (string)$obs, $m)) {
            return (int)($m[1] ?? 0);
        }
        return null;
    }

    private function syncChequeDesdeVenta(Venta $venta, array $data, $metodosPagoDetalle, $metodosPagoString): void
    {
        try {
            if (!Schema::hasTable('cheques')) return;

            $ventaIdTag = 'ORIGEN:VENTA | VENTA_ID:' . ($venta->id ?? '');

            $isCheque = $this->ventaMetodoPrincipalEsCheque($metodosPagoDetalle, $metodosPagoString, $data);

            // Buscar cheque asociado por tag (incluye eliminados por si hay que restaurar)
            $cheque = Cheque::withTrashed()
                ->where('observaciones', 'like', '%' . $ventaIdTag . '%')
                ->orderBy('id', 'desc')
                ->first();

            if (!$isCheque) {
                // Si la venta ya no es Cheque, anular/eliminar cheque asociado si existe
                if ($cheque && !$cheque->trashed()) {
                    $cheque->delete();
                }
                return;
            }

            // Resolver cuenta_id (prioridad: request -> por sucursal -> primera cuenta)
            $cuentaId = $data['cuenta_id'] ?? $data['cuentaId'] ?? $data['cuenta'] ?? $data['id_cuenta'] ?? null;
            if (!$cuentaId && !empty($venta->sucursal_id) && Schema::hasTable('cuentas_bancarias')) {
                $cuentaId = DB::table('cuentas_bancarias')->where('id_sucursal', $venta->sucursal_id)->value('id');
            }
            if (!$cuentaId && Schema::hasTable('cuentas_bancarias')) {
                $cuentaId = DB::table('cuentas_bancarias')->value('id');
            }

            $beneficiarioSucursal = (string)($venta->sucursal_nombre ?? $data['sucursal_nombre'] ?? $venta->sucursal_id ?? $data['sucursal_id'] ?? 'Sucursal');

            $payload = [
                'cuenta_id' => $cuentaId ? (int)$cuentaId : null,
                'numero_cheque' => (string)($data['numero_cheque'] ?? $data['nro_cheque'] ?? $data['cheque_numero'] ?? ($venta->folioVenta ?? $venta->id)),
                'tipo' => 'Recibidos',
                'fecha_emision' => $venta->fecha ?? $data['fecha'] ?? now()->toDateString(),
                // fecha_cobro se mantiene si ya existe (solo se cambia desde módulo cheques)
                'beneficiario' => $beneficiarioSucursal,
                'concepto' => (string)('Venta ' . (($venta->documentoVenta ?? '') ? ($venta->documentoVenta . ' ') : '') . ($venta->folioVenta ?? $venta->id)),
                'monto' => (float)($venta->total ?? $data['total'] ?? 0),
                'estado' => 'Pendiente',
                'observaciones' => trim($ventaIdTag . ' | ' . (string)($data['observaciones'] ?? $venta->observaciones ?? '')),
            ];

            if (Schema::hasColumn('cheques', 'user_id')) {
                $authId = auth()->id();
                if ($authId) $payload['user_id'] = $authId;
            }

            // Si existe, actualizar; si estaba eliminado, restaurar.
            if ($cheque) {
                if ($cheque->trashed()) {
                    $cheque->restore();
                }

                // No sobreescribir fecha_cobro si ya existe
                if (!empty($cheque->fecha_cobro)) {
                    unset($payload['fecha_cobro']);
                }

                // No enviar null cuenta_id si no pudimos resolver (evita romper referencia)
                if (empty($payload['cuenta_id'])) {
                    unset($payload['cuenta_id']);
                }

                $cheque->update($payload);
                return;
            }

            // Crear cheque nuevo
            if (!empty($payload['cuenta_id'])) {
                Cheque::create($payload);
            }
        } catch (\Throwable $e) {
            try {
                Log::warning('syncChequeDesdeVenta: no se pudo sincronizar cheque', ['error' => $e->getMessage(), 'venta_id' => $venta->id ?? null]);
            } catch (\Throwable $__){ }
        }
    }

    private function ventaTieneChequeNoPendiente(Venta $venta): bool
    {
        try {
            if (!Schema::hasTable('cheques')) return false;

            $rawMetodo = strtolower(trim((string)($venta->metodos_pago ?? '')));
            $esCheque = $rawMetodo !== '' && strpos($rawMetodo, 'cheque') !== false;
            if (!$esCheque) return false;

            $ventaIdTag = 'ORIGEN:VENTA | VENTA_ID:' . ($venta->id ?? '');
            $cheque = Cheque::withTrashed()
                ->where('observaciones', 'like', '%' . $ventaIdTag . '%')
                ->orderBy('id', 'desc')
                ->first();

            if (!$cheque) return false;
            if ($cheque->trashed()) return false; // si está eliminado, no bloquea

            $estado = strtolower(trim((string)($cheque->estado ?? '')));
            // Bloquear si el estado es distinto a pendiente
            return $estado !== '' && $estado !== 'pendiente';
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function eliminarChequeAsociadoAVentaSiExiste(Venta $venta): void
    {
        if (!Schema::hasTable('cheques')) return;

        $ventaIdTag = 'ORIGEN:VENTA | VENTA_ID:' . ($venta->id ?? '');
        $cheque = Cheque::withTrashed()
            ->where('observaciones', 'like', '%' . $ventaIdTag . '%')
            ->orderBy('id', 'desc')
            ->first();

        if ($cheque && !$cheque->trashed()) {
            $cheque->delete();
        }
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 50);

        $q = Venta::with(['detalles', 'cliente'])->orderBy('fecha', 'desc');

        // Filtros opcionales
        $fecha = $request->query('fecha');
        if (!empty($fecha)) {
            try { $q->whereDate('fecha', $fecha); } catch (\Throwable $e) {}
        }

        $sucursal = $request->query('sucursal');
        if (!empty($sucursal)) {
            if (is_numeric($sucursal)) {
                $q->where('sucursal_id', (int)$sucursal);
            } else {
                $q->where(function($qq) use ($sucursal) {
                    $qq->where('sucursal_nombre', 'like', '%' . $sucursal . '%');
                    if (Schema::hasColumn('ventas', 'sucursal_id') && Schema::hasTable('sucursales')) {
                        // fallback: si llega nombre, igual intentamos por id string
                        $qq->orWhere('sucursal_id', $sucursal);
                    }
                });
            }
        }

        $metodoRaw = $request->query('metodos_pago') ?? $request->query('metodoPago');
        if (!empty($metodoRaw)) {
            $mr = strtolower(trim((string)$metodoRaw));
            $map = [
                'efectivo' => 'Efectivo',
                'transferencia' => 'Transferencia',
                'debito' => 'Tarjeta Debito',
                'tdebito' => 'Tarjeta Debito',
                'tarjeta debito' => 'Tarjeta Debito',
                'credito' => 'Tarjeta Credito',
                'tcredito' => 'Tarjeta Credito',
                'tarjeta credito' => 'Tarjeta Credito',
                'cheque' => 'Cheque',
                'online' => 'Pago Online',
                'pago online' => 'Pago Online',
                'credito deuda' => 'Credito (Deuda)',
                'credito (deuda)' => 'Credito (Deuda)',
                'crédito (deuda)' => 'Credito (Deuda)',
                'creditodeuda' => 'Credito (Deuda)',
            ];
            $metodo = $map[$mr] ?? $metodoRaw;
            try {
                $q->where('metodos_pago', $metodo);
            } catch (\Throwable $e) {
                // fallback substring
                $q->where('metodos_pago', 'like', '%' . $metodo . '%');
            }
        }

        $ventas = $q->paginate($perPage);

        // Normalizar cliente_nombre / cliente_rut para el frontend (grillas/export)
        try {
            $ventas->getCollection()->transform(function ($v) {
                try {
                    if (empty($v->cliente_nombre)) {
                        $v->cliente_nombre = $v->cliente_nombre
                            ?? ($v->cliente->nombre ?? null)
                            ?? ($v->cliente->razon_social ?? null)
                            ?? ($v->cliente->name ?? null)
                            ?? (is_string($v->cliente) ? $v->cliente : null)
                            ?? ($v->cliente_texto ?? null)
                            ?? ($v->razon_social ?? null)
                            ?? ($v->nombre_cliente ?? null);
                    }

                    if (empty($v->cliente_rut)) {
                        $v->cliente_rut = $v->cliente_rut
                            ?? ($v->cliente->rut ?? null)
                            ?? ($v->cliente->rut_cliente ?? null)
                            ?? ($v->cliente->dni ?? null)
                            ?? ($v->rut ?? null)
                            ?? ($v->rut_cliente ?? null);
                    }

                    // compatibilidad: exponer también como 'cliente' si el frontend lo intenta leer como string
                    if ((empty($v->cliente) || is_object($v->cliente)) && !empty($v->cliente_nombre)) {
                        $v->cliente = $v->cliente_nombre;
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
                return $v;
            });
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json($ventas);
    }

    public function eliminadas(Request $request)
    {
        if (!Schema::hasTable('ventas') || !Schema::hasColumn('ventas', 'deleted_at')) {
            return response()->json(['data' => []]);
        }

        $mes = $request->query('mes'); // YYYY-MM
        $q = DB::table('ventas')->whereNotNull('ventas.deleted_at')->select('ventas.*');

        if (!empty($mes)) {
            try {
                $start = Carbon::createFromFormat('Y-m', $mes)->startOfMonth();
                $end = Carbon::createFromFormat('Y-m', $mes)->endOfMonth();
                $q->whereBetween('ventas.deleted_at', [$start, $end]);
            } catch (\Throwable $e) {
                // ignore filtro si viene inválido
            }
        }

        // Incluir cliente (nombre y rut) si existe tabla clientes y FK cliente_id
        try {
            if (Schema::hasTable('clientes') && Schema::hasColumn('ventas', 'cliente_id')) {
                $cliCols = Schema::getColumnListing('clientes');

                $nameCandidates = [];
                foreach (['nombre', 'razon_social', 'name', 'cliente', 'nombre_cliente'] as $c) {
                    if (in_array($c, $cliCols)) $nameCandidates[] = "clientes.$c";
                }
                $rutCandidates = [];
                foreach (['rut', 'rut_cliente', 'dni', 'documento'] as $c) {
                    if (in_array($c, $cliCols)) $rutCandidates[] = "clientes.$c";
                }

                $selectNombre = "''";
                if (!empty($nameCandidates)) {
                    $selectNombre = 'COALESCE(' . implode(', ', $nameCandidates) . ')';
                }
                $selectRut = "''";
                if (!empty($rutCandidates)) {
                    $selectRut = 'COALESCE(' . implode(', ', $rutCandidates) . ')';
                }

                $q->leftJoin('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                  ->addSelect(DB::raw($selectNombre . ' as cliente_nombre'))
                  ->addSelect(DB::raw($selectRut . ' as cliente_rut'));
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // Resolver sucursal_nombre vía join a sucursales (si existe)
        try {
            if (Schema::hasTable('sucursales') && Schema::hasColumn('ventas', 'sucursal_id')) {
                $q->leftJoin('sucursales', 'ventas.sucursal_id', '=', 'sucursales.id')
                  ->addSelect('sucursales.nombre as sucursal_nombre_join');
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // Incluir nombre de usuario si existe columna de usuario (user_id/created_by/deleted_by...) y tabla users
        try {
            $ventasCols = Schema::getColumnListing('ventas');
            if (Schema::hasTable('users')) {
                $userRef = null;
                foreach (['deleted_by', 'deleted_by_user_id', 'deleted_by_id', 'user_id', 'created_by', 'usuario_id', 'id_usuario'] as $c) {
                    if (in_array($c, $ventasCols)) { $userRef = $c; break; }
                }

                if ($userRef) {
                    $userCols = Schema::getColumnListing('users');
                    $candidates = [];
                    foreach (['name', 'nombre', 'nombre_completo', 'email'] as $uc) {
                        if (in_array($uc, $userCols)) $candidates[] = "users.$uc";
                    }

                    $selectUserExpr = "''";
                    if (!empty($candidates)) {
                        $selectUserExpr = 'COALESCE(' . implode(', ', $candidates) . ')';
                    }

                    $q->leftJoin('users', "ventas.$userRef", '=', 'users.id')
                      ->addSelect(DB::raw($selectUserExpr . ' as usuario_join'));
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        $rows = $q->orderBy('ventas.deleted_at', 'desc')->get();

        // Normalizar campos esperados por el frontend
        $rows = $rows->map(function ($r) {
            try {
                if (empty($r->sucursal_nombre) && !empty($r->sucursal_nombre_join)) {
                    $r->sucursal_nombre = $r->sucursal_nombre_join;
                }

                if (empty($r->usuario)) {
                    if (!empty($r->usuario_join)) {
                        $r->usuario = $r->usuario_join;
                    } else {
                        $u = $this->extraerUsuarioEliminacionDesdeObservaciones($r->observaciones ?? null);
                        if (!empty($u)) $r->usuario = $u;
                    }
                }

                // compatibilidad: exponer también como 'cliente' si el frontend lo intenta leer
                if (empty($r->cliente) && !empty($r->cliente_nombre)) {
                    $r->cliente = $r->cliente_nombre;
                }
            } catch (\Throwable $e) {
                // ignore
            }
            return $r;
        });

        return response()->json(['data' => $rows]);
    }

    public function show($id)
    {
        $venta = Venta::with('detalles')->find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
        }
        return response()->json($venta);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $validator = Validator::make($data, [
            'fecha' => 'required|date',
            'fecha_final' => 'nullable|date',
            'cliente_id' => 'nullable|integer',
            'sucursal_id' => 'nullable|integer',
            'subtotal' => 'required|numeric',
            'iva' => 'required|numeric',
            'total' => 'required|numeric',
            'detalles' => 'required|array|min:1',
            'detalles.*.descripcion' => 'required|string',
            'detalles.*.cantidad' => 'required|numeric',
            'detalles.*.precio_unitario' => 'required|numeric',
            'detalles.*.total_linea' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Compatibilidad: detectar tipo de columna `metodos_pago` y serializar
            $metodosPago = $data['metodos_pago'] ?? null;
            $metodosPagoDetalle = null;
            $columnType = null;
            try {
                if (Schema::hasColumn('ventas', 'metodos_pago')) {
                    $columnType = Schema::getColumnType('ventas', 'metodos_pago');
                }
            } catch (\Exception $e) {
                // ignore, mantendremos null
            }

            // Preparar payload base
            $ventaPayload = [
                'fecha' => $data['fecha'],
                'cliente_id' => $data['cliente_id'] ?? null,
                'sucursal_id' => $data['sucursal_id'] ?? null,
                'sucursal_nombre' => $data['sucursal_nombre'] ?? null,
                'documentoVenta' => $data['documentoVenta'] ?? null,
                'folioVenta' => $data['folioVenta'] ?? null,
                'subtotal' => $data['subtotal'],
                'iva' => $data['iva'],
                'total' => $data['total'],
                'observaciones' => $data['observaciones'] ?? null,
                'estado' => $data['estado'] ?? 'REGISTRADA',
                    'fecha_final' => $data['fecha_final'] ?? null,
            ];

            // Si viene sucursal_id pero no viene nombre, intentar resolver desde tabla sucursales
            try {
                if (empty($ventaPayload['sucursal_nombre']) && !empty($ventaPayload['sucursal_id']) && Schema::hasTable('sucursales')) {
                    $sn = DB::table('sucursales')->where('id', $ventaPayload['sucursal_id'])->value('nombre');
                    if (!empty($sn)) $ventaPayload['sucursal_nombre'] = $sn;
                }
            } catch (\Throwable $e) {
                // ignore
            }

            // Mapear el método principal a los valores del ENUM en `ventas.metodos_pago`
            $map = [
                'efectivo' => 'Efectivo',
                'transferencia' => 'Transferencia',
                'debito' => 'Tarjeta Debito',
                'credito' => 'Tarjeta Credito',
                'cheque' => 'Cheque',
                'online' => 'Pago Online',
                'credito_deuda' => 'Credito (Deuda)'
            ];

            $tipoPrincipal = null;
            if (is_array($metodosPago) && !empty($metodosPago[0]['tipo'])) {
                $tipoPrincipal = $metodosPago[0]['tipo'];
            } elseif (!empty($data['metodo_pago'])) {
                $tipoPrincipal = strtolower(trim($data['metodo_pago']));
            }

            if ($tipoPrincipal) {
                $ventaPayload['metodos_pago'] = $map[$tipoPrincipal] ?? $data['metodo_pago'] ?? null;
            } else {
                $ventaPayload['metodos_pago'] = null;
            }

            $venta = Venta::create($ventaPayload);
            

            foreach ($data['detalles'] as $d) {
                $detalle = new VentaDetalle([
                    'producto_id' => $d['producto_id'] ?? null,
                    'descripcion' => $d['descripcion'],
                    'cantidad' => $d['cantidad'],
                    'precio_unitario' => $d['precio_unitario'],
                    'total_linea' => $d['total_linea'],
                ]);
                $venta->detalles()->save($detalle);
            }

            // Persistir métodos de pago en tabla separada `venta_metodos_pago` si vienen en el request
            if ($metodosPagoDetalle === null && isset($data['metodos_pago']) && is_array($data['metodos_pago'])) {
                $metodosPagoDetalle = $data['metodos_pago'];
            }

            if (!empty($metodosPagoDetalle) && is_array($metodosPagoDetalle)) {
                try {
                    // Persistir en archivo JSON en storage para evitar migraciones
                    $dir = storage_path('app/venta_metodos_pago');
                    if (!file_exists($dir)) mkdir($dir, 0755, true);
                    $file = $dir . DIRECTORY_SEPARATOR . $venta->id . '.json';
                    file_put_contents($file, json_encode($metodosPagoDetalle, JSON_UNESCAPED_UNICODE));
                    Log::info('VentasController@store: metodos_pago persistidos en archivo', ['file' => $file]);
                } catch (\Exception $e) {
                    Log::error('Error escribiendo metodos_pago en archivo', ['error' => $e->getMessage(), 'payload' => $metodosPagoDetalle]);
                }
            }

            // Si el método de pago requiere registrar banco, crear movimiento
            $this->registrarMovimientoBancoDesdeVenta($venta, $data, $metodosPagoDetalle, $ventaPayload['metodos_pago'] ?? null);

            // NUEVO: Si el método de pago principal es Cheque, crear registro en tabla `cheques`
            try {
                if (Schema::hasTable('cheques')) {
                    $tipoRaw = null;
                    if (is_array($metodosPagoDetalle) && !empty($metodosPagoDetalle[0]['tipo'])) {
                        $tipoRaw = strtolower(trim((string)$metodosPagoDetalle[0]['tipo']));
                    } elseif (!empty($data['metodo_pago'])) {
                        $tipoRaw = strtolower(trim((string)$data['metodo_pago']));
                    } elseif (!empty($ventaPayload['metodos_pago'])) {
                        $tipoRaw = strtolower(trim((string)$ventaPayload['metodos_pago']));
                    }

                    $isCheque = $tipoRaw && (strpos($tipoRaw, 'cheque') !== false);
                    if ($isCheque) {
                        // cuenta_id: si no viene, intentar inferir por sucursal, si no, primera cuenta
                        $cuentaId = $data['cuenta_id'] ?? $data['cuentaId'] ?? $data['cuenta'] ?? $data['id_cuenta'] ?? null;
                        if (!$cuentaId && !empty($ventaPayload['sucursal_id']) && Schema::hasTable('cuentas_bancarias')) {
                            $cuentaId = DB::table('cuentas_bancarias')->where('id_sucursal', $ventaPayload['sucursal_id'])->value('id');
                        }
                        if (!$cuentaId && Schema::hasTable('cuentas_bancarias')) {
                            $cuentaId = DB::table('cuentas_bancarias')->value('id');
                        }

                        if ($cuentaId) {
                            $chequeData = [
                                'cuenta_id' => (int)$cuentaId,
                                // número de cheque: si el frontend no lo envía, usar referencia de la venta
                                'numero_cheque' => (string)($data['numero_cheque'] ?? $data['nro_cheque'] ?? $data['cheque_numero'] ?? ($venta->folioVenta ?? $venta->id)),
                                // Por defecto lo tratamos como Recibidos (pago recibido)
                                'tipo' => 'Recibidos',
                                'fecha_emision' => $venta->fecha ?? $data['fecha'] ?? now()->toDateString(),
                                'fecha_cobro' => null,
                                // Mostrar la sucursal como origen en el módulo de cheques
                                'beneficiario' => (string)($ventaPayload['sucursal_nombre'] ?? $data['sucursal_nombre'] ?? $venta->sucursal_nombre ?? $ventaPayload['sucursal_id'] ?? $data['sucursal_id'] ?? 'Sucursal'),
                                'concepto' => (string)('Venta ' . (($venta->documentoVenta ?? '') ? ($venta->documentoVenta . ' ') : '') . ($venta->folioVenta ?? $venta->id)),
                                'monto' => (float)($venta->total ?? $data['total'] ?? 0),
                                'estado' => 'Pendiente',
                                'observaciones' => trim('ORIGEN:VENTA | VENTA_ID:' . ($venta->id ?? '') . ' | ' . (string)($data['observaciones'] ?? '')),
                            ];

                            if (Schema::hasColumn('cheques', 'user_id')) {
                                $authId = auth()->id();
                                if ($authId) $chequeData['user_id'] = $authId;
                            }

                            Cheque::create($chequeData);
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo crear cheque desde venta', ['error' => $e->getMessage(), 'venta_id' => $venta->id ?? null]);
            }

            DB::commit();

            // Adjuntar métodos de pago persistidos (si existen) al objeto devuelto
            try {
                $venta = $venta->load('detalles');
                $file = storage_path('app/venta_metodos_pago') . DIRECTORY_SEPARATOR . $venta->id . '.json';
                if (file_exists($file)) {
                    $met = json_decode(file_get_contents($file), true);
                    $venta->metodos_pago_detalle = $met;
                }
            } catch (\Exception $e) {
                // ignore
            }

            // NUEVO: buscar pagos en CxC relacionados a esta venta y adjuntarlos al objeto devuelto
            try {
                $pagos = [];
                $montoPagado = 0.0;

                if (Schema::hasTable('pagos_cuentas_cobrar')) {
                    // Preferir relacion directa por venta_id si existe
                    if (Schema::hasColumn('pagos_cuentas_cobrar', 'venta_id')) {
                        $q = DB::table('pagos_cuentas_cobrar')->where('venta_id', $venta->id);

                        // Selección de columnas comunes
                        $selectCols = ['id'];
                        $pcCols = Schema::getColumnListing('pagos_cuentas_cobrar');
                        foreach (['fecha', 'created_at', 'fecha_pago'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                        foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                        foreach (['metodo', 'metodo_pago', 'tipo', 'forma_pago'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                        foreach (['comprobante', 'referencia', 'nota'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                        foreach (['user_id', 'usuario_id', 'created_by'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;

                        $selectCols = array_unique($selectCols);

                        $rawPagos = $q->select($selectCols)->orderBy('id', 'asc')->get();
                        foreach ($rawPagos as $p) {
                            $pArr = (array) $p;
                            // intentar extraer monto por columnas conocidas
                            $m = 0.0;
                            foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) {
                                if (array_key_exists($c, $pArr) && !empty($pArr[$c])) { $m = (float)$pArr[$c]; break; }
                            }
                            $montoPagado += $m;
                            $pagos[] = $pArr;
                        }
                    } else {
                        // Si no existe venta_id en pagos, buscar cuentas_cobrar vinculadas a la venta y sus pagos
                        if (Schema::hasTable('cuentas_cobrar') && Schema::hasColumn('cuentas_cobrar', 'venta_id')) {
                            $cuentas = DB::table('cuentas_cobrar')->where('venta_id', $venta->id)->pluck('id')->toArray();
                            if (!empty($cuentas)) {
                                $q = DB::table('pagos_cuentas_cobrar')->whereIn('cuenta_cobrar_id', $cuentas);
                                $pcCols = Schema::getColumnListing('pagos_cuentas_cobrar');
                                $selectCols = ['id'];
                                foreach (['fecha', 'created_at', 'fecha_pago'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                                foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                                foreach (['metodo', 'metodo_pago', 'tipo', 'forma_pago'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                                foreach (['comprobante', 'referencia', 'nota'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                                foreach (['user_id', 'usuario_id', 'created_by'] as $c) if (in_array($c, $pcCols)) $selectCols[] = $c;
                                $selectCols = array_unique($selectCols);

                                $rawPagos = $q->select($selectCols)->orderBy('id', 'asc')->get();
                                foreach ($rawPagos as $p) {
                                    $pArr = (array) $p;
                                    $m = 0.0;
                                    foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) {
                                        if (array_key_exists($c, $pArr) && !empty($pArr[$c])) { $m = (float)$pArr[$c]; break; }
                                    }
                                    $montoPagado += $m;
                                    $pagos[] = $pArr;
                                }
                            }
                        }
                    }
                }

                // Fallback: si no hay tabla de pagos, intentar leer monto en la propia venta (sin persistir cambios)
                if (empty($pagos)) {
                    $cols = Schema::hasTable('ventas') ? Schema::getColumnListing('ventas') : [];
                    foreach (['monto_pagado', 'montoPagado', 'pagado', 'total_pagado', 'abonado', 'abono', 'saldo_pagado'] as $c) {
                        if (in_array($c, $cols) && !empty($venta->{$c})) {
                            $montoPagado = max($montoPagado, (float)$venta->{$c});
                        }
                    }
                }

                // Adjuntar datos al objeto de respuesta sin modificar la tabla ventas
                $venta->pagos = $pagos;
                $venta->monto_pagado = $montoPagado;
            } catch (\Throwable $e) {
                try { Log::warning('VentasController@store: error adjuntando pagos a venta', ['error' => $e->getMessage(), 'venta_id' => $venta->id ?? null]); } catch (\Throwable $__) {}
                // continuar sin bloquear la respuesta
            }

            return response()->json($venta, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Venta store exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $data,
            ]);
            return response()->json([
                'message' => 'Error al crear venta',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Crear movimiento bancario cuando el método de pago lo requiere.
     */
    protected function registrarMovimientoBancoDesdeVenta($venta, $data, $metodosPagoDetalle, $metodoEnum)
    {
        try {
            if (!Schema::hasTable('movimientos_banco')) return;

            $tipoRaw = null;
            if (is_array($metodosPagoDetalle) && !empty($metodosPagoDetalle[0]['tipo'])) {
                $tipoRaw = strtolower(trim($metodosPagoDetalle[0]['tipo']));
            } elseif (!empty($data['metodo_pago'])) {
                $tipoRaw = strtolower(trim($data['metodo_pago']));
            } elseif (!empty($metodoEnum)) {
                $tipoRaw = strtolower(trim($metodoEnum));
            }

            // Solo estos métodos deben impactar banco
            $metodosBanco = ['transferencia', 'tarjeta debito', 'tarjeta credito', 'pago online', 'debito', 'credito', 'online', 'transferencia bancaria'];
            if (!$tipoRaw) return;
            // Helper: eliminar movimiento asociado a esta venta (solo si está taggeado)
            $deleteMovimientoBancoVenta = function() use ($venta) {
                try {
                    if (!Schema::hasTable('movimientos_banco')) return;
                    $cols = Schema::getColumnListing('movimientos_banco');
                    $obsCol = null;
                    foreach (['observaciones', 'observacion', 'notes', 'notas', 'nota'] as $c) {
                        if (in_array($c, $cols)) { $obsCol = $c; break; }
                    }
                    if (!$obsCol || empty($venta->id)) return;

                    $q = DB::table('movimientos_banco')->where($obsCol, 'like', '%VENTA_ID:' . $venta->id . '%');
                    if (in_array('deleted_at', $cols)) {
                        $payload = ['deleted_at' => now()];
                        if (in_array('updated_at', $cols)) $payload['updated_at'] = now();
                        $q->update($payload);
                    } else {
                        $q->delete();
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            };

            // No registrar movimiento bancario para Crédito (Deuda)
            if (strpos($tipoRaw, 'deuda') !== false) {
                $deleteMovimientoBancoVenta();
                return;
            }

            $matchBanco = false;
            foreach ($metodosBanco as $m) {
                if (strpos($tipoRaw, $m) !== false) { $matchBanco = true; break; }
            }
            if (!$matchBanco) {
                $deleteMovimientoBancoVenta();
                return;
            }

            // Tag para poder identificar y proteger el movimiento (sin migraciones)
            $ventaIdTag = 'ORIGEN:VENTA | VENTA_ID:' . ($venta->id ?? '');

            // Cuenta bancaria destino: preferir cuenta_id del request; si no viene, usar primera cuenta bancaria disponible
            $cuentaId = $data['cuenta_id'] ?? $data['cuentaId'] ?? $data['cuenta'] ?? $data['id_cuenta'] ?? null;
            if (!$cuentaId) {
                $cuentaId = DB::table('cuentas_bancarias')->value('id');
            }
            if (!$cuentaId) {
                Log::warning('VentasController: no se pudo registrar movimiento banco (sin cuenta bancaria)', [
                    'venta_id' => $venta->id ?? null,
                    'metodo_pago' => $tipoRaw,
                ]);
                return;
            }

            $cols = Schema::getColumnListing('movimientos_banco');
            $pick = function(array $candidates) use ($cols) {
                foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
                foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
                return null;
            };

            $mapping = [
                'fecha' => $pick(['fecha', 'date', 'fecha_mov']),
                'descripcion' => $pick(['descripcion', 'detalle', 'concepto']),
                'categoria' => $pick(['categoria', 'categoria_mov', 'category']),
                'tipo' => $pick(['tipo', 'tipo_movimiento', 'movement_type']),
                'sucursal' => $pick(['sucursal', 'branch', 'origen']),
                'monto' => $pick(['monto', 'valor', 'importe', 'amount']),
                'cuenta_id' => $pick(['cuenta_id', 'cuenta', 'account_id']),
                'referencia' => $pick(['referencia', 'referencia_mov', 'reference']),
                'observaciones' => $pick(['observaciones', 'observacion', 'notes']),
                'usuario' => $pick(['usuario', 'user', 'usuario_id', 'user_id'])
            ];

            // Categoría debe coincidir con lo solicitado (y con el ENUM si existe)
            $categoriaCandidate = null;
            if (strpos($tipoRaw, 'pago online') !== false || strpos($tipoRaw, 'online') !== false) {
                $categoriaCandidate = 'Pago Online';
            } elseif (strpos($tipoRaw, 'tarjeta debito') !== false || strpos($tipoRaw, 'debito') !== false) {
                $categoriaCandidate = 'Tarjeta Debito';
            } elseif (strpos($tipoRaw, 'tarjeta credito') !== false || strpos($tipoRaw, 'credito') !== false) {
                $categoriaCandidate = 'Tarjeta Credito';
            } elseif (strpos($tipoRaw, 'transferencia') !== false) {
                $categoriaCandidate = 'Transferencia';
            }

            $insert = [];
            $base = [
                'fecha' => $data['fecha'] ?? now()->toDateString(),
                'descripcion' => 'Venta ' . (($venta->documentoVenta ?? '') ? ($venta->documentoVenta . ' ') : '') . ($venta->folioVenta ?? $venta->id),
                'tipo' => 'CREDITO',
                'sucursal' => $data['sucursal_nombre'] ?? $data['sucursal_id'] ?? null,
                'monto' => (float)($data['total'] ?? $venta->total ?? 0),
                'cuenta_id' => $cuentaId,
                'referencia' => $venta->folioVenta ?? $venta->id,
                'observaciones' => trim((string)($data['observaciones'] ?? $venta->observaciones ?? '')),
            ];

            // Asegurar tag en observaciones si existe la columna
            if (!empty($mapping['observaciones'])) {
                $obs = $base['observaciones'] ?? '';
                $obsLower = strtolower($obs);
                if (strpos($obsLower, 'venta_id:') === false && strpos($obsLower, 'origen:venta') === false) {
                    $base['observaciones'] = trim(($obs ? ($obs . ' | ') : '') . $ventaIdTag);
                }
            }

            // Incluir categoria solo si el ENUM/columna lo acepta; si no, omitimos (sin migraciones)
            if (!empty($categoriaCandidate) && !empty($mapping['categoria'])) {
                $allowed = null;
                try {
                    $catCol = $mapping['categoria'];
                    $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$catCol]);
                    if (!empty($colInfo) && isset($colInfo[0]->Type)) {
                        $typeDef = $colInfo[0]->Type;
                        if (stripos($typeDef, 'enum') !== false) {
                            preg_match_all("/\\'([^']+)\\'/", $typeDef, $matches);
                            $allowed = $matches[1] ?? [];
                        }
                    }
                } catch (\Throwable $e) {
                    $allowed = null;
                }

                if (empty($allowed)) {
                    $base['categoria'] = $categoriaCandidate;
                } else {
                    $found = in_array($categoriaCandidate, $allowed, true) || in_array(strtolower($categoriaCandidate), array_map('strtolower', $allowed), true);
                    if ($found) {
                        $base['categoria'] = $categoriaCandidate;
                    }
                }
            }

            foreach ($mapping as $key => $col) {
                if ($col && array_key_exists($key, $base)) {
                    $insert[$col] = $base[$key];
                }
            }

            // Normalizar tipo según enum real
            if (!empty($mapping['tipo'])) {
                $typeCol = $mapping['tipo'];
                $useIngresoEg = false;
                try {
                    $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$typeCol]);
                    if (!empty($colInfo) && isset($colInfo[0]->Type)) {
                        $typeDef = strtoupper($colInfo[0]->Type);
                        if (strpos($typeDef, 'INGRESO') !== false || strpos($typeDef, 'EGRESO') !== false) {
                            $useIngresoEg = true;
                        }
                    }
                } catch (\Exception $ex) {}

                $insert[$typeCol] = $useIngresoEg ? 'INGRESO' : 'CREDITO';
            }

            if (in_array('created_at', $cols)) $insert['created_at'] = now();
            if (in_array('updated_at', $cols)) $insert['updated_at'] = now();

            // usuario autenticado si existe
            try {
                $authId = optional(request()->user())->id ?? \Auth::id();
                $userColDetected = $pick(['user_id', 'usuario', 'usuario_id', 'user', 'userId']);
                if ($authId && $userColDetected && !array_key_exists($userColDetected, $insert)) {
                    $insert[$userColDetected] = $authId;
                }
                if ($authId && in_array('user_id', $cols) && !array_key_exists('user_id', $insert)) {
                    $insert['user_id'] = $authId;
                }
            } catch (\Throwable $e) {}

            // Upsert: si ya existe un movimiento de esta venta (por tag), actualizar; si no, insertar
            try {
                $existing = null;
                try {
                    $q = DB::table('movimientos_banco');
                    if (!empty($mapping['observaciones'])) {
                        $q->where($mapping['observaciones'], 'like', '%VENTA_ID:' . ($venta->id ?? '') . '%');
                    } elseif (!empty($mapping['referencia'])) {
                        $q->where($mapping['referencia'], $venta->folioVenta ?? $venta->id);
                    }
                    if (in_array('deleted_at', $cols)) $q->whereNull('deleted_at');
                    $existing = $q->orderBy('id', 'desc')->first();
                } catch (\Throwable $e) {
                    $existing = null;
                }

                // Fallback para ventas antiguas sin tag: buscar por referencia + descripción tipo "Venta ..."
                if (!$existing && !empty($mapping['referencia']) && !empty($mapping['descripcion'])) {
                    try {
                        $q2 = DB::table('movimientos_banco')
                            ->where($mapping['referencia'], $venta->folioVenta ?? $venta->id)
                            ->where($mapping['descripcion'], 'like', 'Venta%');
                        if (in_array('deleted_at', $cols)) $q2->whereNull('deleted_at');
                        $existing = $q2->orderBy('id', 'desc')->first();
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }

                if ($existing && isset($existing->id)) {
                    $update = $insert;
                    unset($update['created_at']);
                    unset($update['id']);
                    if (in_array('updated_at', $cols)) $update['updated_at'] = now();
                    try {
                        Log::info('VentasController: movimiento_banco update payload', ['id' => $existing->id, 'update' => $update, 'venta_id' => $venta->id ?? null]);
                    } catch (\Throwable $ex) {}
                    DB::table('movimientos_banco')->where('id', $existing->id)->update($update);
                } else {
                    try {
                        Log::info('VentasController: movimiento_banco insert payload', ['insert' => $insert, 'venta_id' => $venta->id ?? null]);
                    } catch (\Throwable $ex) {}
                    DB::table('movimientos_banco')->insert($insert);
                }
            } catch (\Exception $e) {
                Log::error('VentasController: error upsert movimiento_banco', ['error' => $e->getMessage(), 'insert' => $insert, 'venta_id' => $venta->id ?? null]);
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('VentasController: error registrando movimiento banco', ['error' => $e->getMessage(), 'venta_id' => $venta->id ?? null]);
            // No abortar la venta si falla el movimiento bancario
            return;
        }
    }

    /**
     * Determina si una venta (Crédito/Deuda) tiene pagos aplicados.
     *
     * Nota: en este sistema, las ventas a crédito se reflejan como cuentas y los pagos
     * pueden quedar persistidos en la propia venta con columnas tipo `monto_pagado`/`pagado`.
     * Si en tu BD los pagos se registran en otra tabla, aquí es el lugar para agregar la validación.
     */
    private function ventaCreditoTienePagos(Venta $venta): bool
    {
        try {
            $metodo = strtolower(trim((string)($venta->metodos_pago ?? '')));
            if ($metodo !== 'credito (deuda)') return false;

            // 1) Si existe tabla de pagos de CxC, comprobar allí primero
            try {
                if (Schema::hasTable('pagos_cuentas_cobrar')) {
                    // Si la tabla de pagos contiene referencia directa a venta_id
                    if (Schema::hasColumn('pagos_cuentas_cobrar', 'venta_id')) {
                        $count = DB::table('pagos_cuentas_cobrar')
                            ->where('venta_id', $venta->id)
                            ->where(function ($q) {
                                // columnas comunes para monto en la tabla de pagos
                                if (Schema::hasColumn('pagos_cuentas_cobrar', 'monto_pagado')) $q->orWhere('monto_pagado', '>', 0);
                                if (Schema::hasColumn('pagos_cuentas_cobrar', 'monto')) $q->orWhere('monto', '>', 0);
                            })
                            ->count();
                        if ($count > 0) return true;
                    }

                    // Si no hay columna venta_id, intentar por relación con cuentas_cobrar (cuentas vinculadas a venta)
                    if (Schema::hasTable('cuentas_cobrar') && Schema::hasColumn('cuentas_cobrar', 'venta_id')) {
                        $cuentas = DB::table('cuentas_cobrar')->where('venta_id', $venta->id)->pluck('id')->toArray();
                        if (!empty($cuentas)) {
                            $q = DB::table('pagos_cuentas_cobrar')->whereIn('cuenta_cobrar_id', $cuentas);
                            if (Schema::hasColumn('pagos_cuentas_cobrar', 'monto_pagado')) $q->where('monto_pagado', '>', 0);
                            elseif (Schema::hasColumn('pagos_cuentas_cobrar', 'monto')) $q->where('monto', '>', 0);
                            else $q->whereRaw('1 = 1'); // sin columna de monto asumimos existencia como pago

                            if ($q->count() > 0) return true;
                        }
                    }
                }
            } catch (\Throwable $e) {
                // si falla la consulta a tablas de pagos, seguir con el fallback
                try { Log::warning('ventaCreditoTienePagos: error comprobando pagos CxC', ['error' => $e->getMessage(), 'venta_id' => $venta->id]); } catch (\Throwable $__) {}
            }

            // 2) Fallback: buscar campos en la propia fila de ventas que indiquen abonos/pagos
            $montoPagado = 0;
            foreach (['monto_pagado', 'montoPagado', 'pagado', 'total_pagado', 'abonado', 'abono', 'saldo_pagado'] as $col) {
                try {
                    if (Schema::hasColumn('ventas', $col)) {
                        $montoPagado = max($montoPagado, (float)($venta->{$col} ?? 0));
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            return $montoPagado > 0.00001;
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function update(Request $request, $id)
    {
        $venta = Venta::find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
        }

        // NUEVO: Bloqueo por cheque (si el cheque asociado ya no está Pendiente)
        if ($this->ventaTieneChequeNoPendiente($venta)) {
            return response()->json([
                'message' => 'No se puede editar una venta pagada con Cheque cuando el cheque ya no está en estado Pendiente.',
                'code' => 'VENTA_CHEQUE_NO_PENDIENTE',
            ], 409);
        }

        // Bloqueo: si es Crédito (Deuda) y ya tiene pagos registrados, no permitir edición
        if ($this->ventaCreditoTienePagos($venta)) {
            return response()->json([
                'message' => 'No se puede editar una venta a Crédito (Deuda) que ya tiene pagos registrados en Cuentas por Pagar.',
                'code' => 'VENTA_CREDITO_CON_PAGOS',
            ], 409);
        }

        $data = $request->all();
        $validator = Validator::make($data, [
            'fecha' => 'sometimes|date',
            'fecha_final' => 'nullable|date',
            'cliente_id' => 'nullable|integer',
            'sucursal_id' => 'nullable|integer',
            'subtotal' => 'sometimes|numeric',
            'iva' => 'sometimes|numeric',
            'total' => 'sometimes|numeric',
            'detalles' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $metodosPago = $data['metodos_pago'] ?? ($venta->metodos_pago ?? null);
            $metodosPagoDetalle = null;
            $columnType = null;
            try {
                if (Schema::hasColumn('ventas', 'metodos_pago')) {
                    $columnType = Schema::getColumnType('ventas', 'metodos_pago');
                }
            } catch (\Exception $e) {
                // ignore
            }

            $updatePayload = [
                'fecha' => $data['fecha'] ?? $venta->fecha,
                'fecha_final' => $data['fecha_final'] ?? $venta->fecha_final ?? null,
                'cliente_id' => $data['cliente_id'] ?? $venta->cliente_id,
                'sucursal_id' => $data['sucursal_id'] ?? $venta->sucursal_id,
                'sucursal_nombre' => $data['sucursal_nombre'] ?? $venta->sucursal_nombre,
                'documentoVenta' => $data['documentoVenta'] ?? $venta->documentoVenta,
                'folioVenta' => $data['folioVenta'] ?? $venta->folioVenta,
                'subtotal' => $data['subtotal'] ?? $venta->subtotal,
                'iva' => $data['iva'] ?? $venta->iva,
                'total' => $data['total'] ?? $venta->total,
                'observaciones' => $data['observaciones'] ?? $venta->observaciones,
                'estado' => $data['estado'] ?? $venta->estado,
            ];

            // Si viene sucursal_id pero no viene nombre, intentar resolver desde tabla sucursales
            try {
                if (empty($updatePayload['sucursal_nombre']) && !empty($updatePayload['sucursal_id']) && Schema::hasTable('sucursales')) {
                    $sn = DB::table('sucursales')->where('id', $updatePayload['sucursal_id'])->value('nombre');
                    if (!empty($sn)) $updatePayload['sucursal_nombre'] = $sn;
                }
            } catch (\Throwable $e) {
                // ignore
            }

            // Mapear el método principal a los valores del ENUM en `ventas.metodos_pago`
            $map = [
                'efectivo' => 'Efectivo',
                'transferencia' => 'Transferencia',
                'debito' => 'Tarjeta Debito',
                'credito' => 'Tarjeta Credito',
                'cheque' => 'Cheque',
                'online' => 'Pago Online',
                'credito_deuda' => 'Credito (Deuda)'
            ];

            $tipoPrincipal = null;
            if (is_array($metodosPago) && !empty($metodosPago[0]['tipo'])) {
                $tipoPrincipal = $metodosPago[0]['tipo'];
            } elseif (!empty($data['metodo_pago'])) {
                $tipoPrincipal = strtolower(trim($data['metodo_pago']));
            }

            if ($tipoPrincipal) {
                $updatePayload['metodos_pago'] = $map[$tipoPrincipal] ?? $data['metodo_pago'] ?? $venta->metodos_pago;
            } else {
                $updatePayload['metodos_pago'] = $venta->metodos_pago;
            }

            $venta->update($updatePayload);

            // Preparar metodosPagoDetalle si viene en request
            if ($metodosPagoDetalle === null && isset($data['metodos_pago']) && is_array($data['metodos_pago'])) {
                $metodosPagoDetalle = $data['metodos_pago'];
            }

            // Persistir/actualizar métodos de pago en tabla separada
            try {
                if (!empty($metodosPagoDetalle) && is_array($metodosPagoDetalle)) {
                    // Guardar/actualizar en archivo JSON en storage
                    $dir = storage_path('app/venta_metodos_pago');
                    if (!file_exists($dir)) mkdir($dir, 0755, true);
                    $file = $dir . DIRECTORY_SEPARATOR . $venta->id . '.json';
                    file_put_contents($file, json_encode($metodosPagoDetalle, JSON_UNESCAPED_UNICODE));
                    Log::info('VentasController@update: metodos_pago persistidos en archivo', ['file' => $file]);
                }
            } catch (\Exception $e) {
                Log::error('Error escribiendo metodos_pago en archivo', ['error' => $e->getMessage(), 'venta_id' => $venta->id, 'payload' => $metodosPagoDetalle]);
            }

            if (isset($data['detalles'])) {
                // eliminar detalles existentes y crear nuevos (simplifica la sincronización)
                $venta->detalles()->delete();
                foreach ($data['detalles'] as $d) {
                    $detalle = new VentaDetalle([
                        'producto_id' => $d['producto_id'] ?? null,
                        'descripcion' => $d['descripcion'] ?? null,
                        'cantidad' => $d['cantidad'] ?? 0,
                        'precio_unitario' => $d['precio_unitario'] ?? 0,
                        'total_linea' => $d['total_linea'] ?? 0,
                    ]);
                    $venta->detalles()->save($detalle);
                }
            }

            DB::commit();

            // Sincronizar movimiento en banco al editar venta (sin abortar si falla)
            try {
                $this->registrarMovimientoBancoDesdeVenta($venta, array_merge($data, $updatePayload), $metodosPagoDetalle, $updatePayload['metodos_pago'] ?? null);
            } catch (\Throwable $e) {
                Log::error('VentasController@update: error sincronizando movimiento_banco', ['error' => $e->getMessage(), 'venta_id' => $venta->id]);
            }

            // NUEVO: sincronizar cheque asociado a la venta según método de pago
            try {
                $this->syncChequeDesdeVenta($venta, array_merge($data, $updatePayload), $metodosPagoDetalle, $updatePayload['metodos_pago'] ?? null);
            } catch (\Throwable $e) {
                Log::warning('VentasController@update: error sincronizando cheque', ['error' => $e->getMessage(), 'venta_id' => $venta->id]);
            }

            // Adjuntar métodos de pago persistidos (si existen) al objeto devuelto
            try {
                $venta = $venta->load('detalles');
                $file = storage_path('app/venta_metodos_pago') . DIRECTORY_SEPARATOR . $venta->id . '.json';
                if (file_exists($file)) {
                    $met = json_decode(file_get_contents($file), true);
                    $venta->metodos_pago_detalle = $met;
                }
            } catch (\Exception $e) {
                // ignore
            }

            return response()->json($venta);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Venta update exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $data,
                'venta_id' => $id,
            ]);
            return response()->json([
                'message' => 'Error al actualizar venta',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $venta = Venta::find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
        }

        // NUEVO: Si es venta con Cheque y el cheque ya no está Pendiente, no permitir eliminar
        if ($this->ventaTieneChequeNoPendiente($venta)) {
            return response()->json([
                'message' => 'No se puede eliminar una venta pagada con Cheque cuando el cheque ya no está en estado Pendiente.',
                'code' => 'VENTA_CHEQUE_NO_PENDIENTE',
            ], 409);
        }

        // Bloqueo: si es Crédito (Deuda) y ya tiene pagos registrados, no permitir eliminación
        try {
            if ($this->ventaCreditoTienePagos($venta)) {
                return response()->json([
                    'message' => 'No se puede eliminar una venta a Crédito (Deuda) que ya tiene pagos registrados en Cuentas por Cobrar.',
                    'code' => 'VENTA_CREDITO_CON_PAGOS'
                ], 409);
            }
        } catch (\Throwable $e) {
            // si falla la comprobación, continuar con la eliminación (pero registramos el warning)
            try { Log::warning('VentasController@destroy: error comprobando pagos antes de eliminar', ['error' => $e->getMessage(), 'venta_id' => $venta->id]); } catch (\Throwable $__) {}
        }

        DB::beginTransaction();
        try {
            // Guardar usuario que elimina (sin migraciones: en observaciones y/o columna si existe)
            try {
                $user = $request->user() ?: Auth::user();
                if ($user) {
                    $userId = $user->id ?? null;
                    $userName = $user->name ?? $user->nombre ?? $user->email ?? null;

                    $obs = (string) ($venta->observaciones ?? '');
                    $tag = 'ELIMINADO_POR:' . ($userId ?? '-') . ' | ' . ($userName ?? '-');
                    if (stripos($obs, 'ELIMINADO_POR:') === false) {
                        $venta->observaciones = trim($obs . (strlen(trim($obs)) ? "\n" : '') . $tag);
                    }

                    // Si la tabla tiene alguna columna para guardar el usuario, setearla también
                    try {
                        $colsVentas = Schema::getColumnListing('ventas');
                        foreach (['deleted_by', 'deleted_by_user_id', 'deleted_by_id'] as $c) {
                            if (in_array($c, $colsVentas) && !empty($userId)) {
                                $venta->{$c} = $userId;
                                break;
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore
                    }

                    $venta->save();
                }
            } catch (\Throwable $e) {
                // ignore
            }

            // Si existe movimiento bancario asociado a esta venta, marcar deleted_at (sin migraciones)
            try {
                if (Schema::hasTable('movimientos_banco')) {
                    $cols = Schema::getColumnListing('movimientos_banco');
                    $obsCol = null;
                    foreach (['observaciones', 'observacion', 'notes', 'notas', 'nota'] as $c) {
                        if (in_array($c, $cols)) { $obsCol = $c; break; }
                    }
                    $refCol = null;
                    foreach (['referencia', 'reference', 'partida'] as $c) {
                        if (in_array($c, $cols)) { $refCol = $c; break; }
                    }
                    $descCol = null;
                    foreach (['descripcion', 'detalle', 'concepto'] as $c) {
                        if (in_array($c, $cols)) { $descCol = $c; break; }
                    }

                    $qMov = DB::table('movimientos_banco');
                    $ventaId = $venta->id;
                    $folio = $venta->folioVenta ?? $venta->id;

                    $tieneFiltro = false;
                    $qMov->where(function ($qq) use (&$tieneFiltro, $obsCol, $refCol, $descCol, $ventaId, $folio) {
                        $hayPrimeraCondicion = false;
                        if ($obsCol) {
                            $qq->where($obsCol, 'like', '%VENTA_ID:' . $ventaId . '%');
                            $tieneFiltro = true;
                            $hayPrimeraCondicion = true;
                        }
                        // fallback para ventas antiguas sin tag
                        if ($refCol) {
                            $method = $hayPrimeraCondicion ? 'orWhere' : 'where';
                            $qq->{$method}(function ($q2) use ($refCol, $descCol, $folio) {
                                $q2->where($refCol, $folio);
                                if ($descCol) $q2->where($descCol, 'like', 'Venta%');
                            });
                            $tieneFiltro = true;
                        }
                    });

                    if (!$tieneFiltro) {
                        // no arriesgar update/delete masivo
                        throw new \RuntimeException('No se pudo determinar un filtro seguro para el movimiento bancario de la venta.');
                    }

                    if (in_array('deleted_at', $cols)) {
                        $payload = ['deleted_at' => now()];
                        if (in_array('updated_at', $cols)) $payload['updated_at'] = now();
                        $qMov->update($payload);
                    } else {
                        $qMov->delete();
                    }
                }
            } catch (\Throwable $e) {
                // no romper por errores de banco
            }

            // NUEVO: si es venta con cheque (pendiente), al eliminar desde ventas eliminar también el registro en cheques
            try {
                $rawMetodo = strtolower(trim((string)($venta->metodos_pago ?? '')));
                if ($rawMetodo !== '' && strpos($rawMetodo, 'cheque') !== false) {
                    $this->eliminarChequeAsociadoAVentaSiExiste($venta);
                }
            } catch (\Throwable $e) {
                // no abortar eliminación de venta por fallo al borrar cheque, pero dejar log
                try { Log::warning('VentasController@destroy: no se pudo eliminar cheque asociado', ['error' => $e->getMessage(), 'venta_id' => $venta->id]); } catch (\Throwable $__){ }
            }

            // Soft delete de la venta (modelo ya maneja detalles)
            $venta->delete();
            DB::commit();
            return response()->json(['message' => 'Venta eliminada']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al eliminar venta', 'error' => $e->getMessage()], 500);
        }
    }

    public function export(Request $request)
    {
        $response = new StreamedResponse(function () use ($request) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'fecha', 'cliente_id', 'subtotal', 'iva', 'total', 'estado']);
            Venta::with('detalles')->orderBy('fecha', 'desc')->chunk(200, function ($ventas) use ($handle) {
                foreach ($ventas as $v) {
                    fputcsv($handle, [
                        $v->id,
                        $v->fecha,
                        $v->cliente_id,
                        $v->subtotal,
                        $v->iva,
                        $v->total,
                        $v->estado,
                    ]);
                }
            });
            fclose($handle);
        });

        $filename = 'ventas_export_' . date('Ymd_His') . '.csv';
        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        return $response;
    }

    // Dev helper: devuelve las últimas filas de `venta_metodos_pago` (solo en local o debug)
    public function debugMetodos(Request $request)
    {
        if (env('APP_ENV') !== 'local' && !env('APP_DEBUG')) {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        try {
            $dir = storage_path('app/venta_metodos_pago');
            $out = [];
            if (file_exists($dir) && is_dir($dir)) {
                $files = scandir($dir, SCANDIR_SORT_DESCENDING);
                $count = 0;
                foreach ($files as $f) {
                    if ($f === '.' || $f === '..') continue;
                    if ($count >= 20) break;
                    $path = $dir . DIRECTORY_SEPARATOR . $f;
                    if (!is_file($path)) continue;
                    $ventaId = pathinfo($f, PATHINFO_FILENAME);
                    $content = json_decode(file_get_contents($path), true);
                    $out[] = ['venta_id' => $ventaId, 'metodos' => $content, 'file' => $path];
                    $count++;
                }
            }
            return response()->json($out);
        } catch (\Exception $e) {
            Log::error('VentasController@debugMetodos error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error reading venta_metodos_pago', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint para comprobar si una venta (Credito/Deuda) tiene pagos registrados.
     * Devuelve { tiene_pagos: bool, motivo: string }
     */
    public function tienePagos($id)
    {
        try {
            $venta = Venta::find($id);
            if (!$venta) return response()->json(['message' => 'Venta no encontrada'], 404);

            $tiene = $this->ventaCreditoTienePagos($venta);
            $motivo = $tiene ? 'La venta tiene pagos registrados en Cuentas por Cobrar.' : 'No se detectaron pagos para esta venta.';
            return response()->json(['tiene_pagos' => $tiene, 'motivo' => $motivo]);
        } catch (\Throwable $e) {
            Log::error('VentasController@tienePagos error', ['error' => $e->getMessage(), 'venta_id' => $id]);
            return response()->json(['message' => 'Error comprobando pagos'], 500);
        }
    }
}

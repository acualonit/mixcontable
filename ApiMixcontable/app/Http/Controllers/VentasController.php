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

            

    public function update(Request $request, $id)
    {
        $venta = Venta::find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
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
}
// <?php

// namespace App\Http\Controllers;

// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Session;
// use Illuminate\Support\Facades\Storage;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
// use App\Models\Venta;
// use App\Models\VentaDetalle;
// use Illuminate\Support\Facades\Validator;
// use Symfony\Component\HttpFoundation\StreamedResponse;

// class VentasController extends Controller
// {
//     // Lista ventas desde sesión (mock) con filtros simples
//     public function index(Request $request)
//     {
//         // Leer ventas desde archivo persistente si existe (más fiable en entorno dev)
//         $path = storage_path('app/mock_ventas.json');
//         if (file_exists($path)) {
//             $content = file_get_contents($path);
//             $ventas = json_decode($content, true) ?: [];
//         } else {
//             $ventas = Session::get('mock_ventas', []);
//         }

//         // Aplicar filtros básicos
//         if ($request->filled('fecha')) {
//             $ventas = array_filter($ventas, function ($v) use ($request) {
//                 return isset($v['fecha']) && $v['fecha'] === $request->get('fecha');
//             });
//         }

//         if ($request->filled('sucursal')) {
//             $ventas = array_filter($ventas, function ($v) use ($request) {
//                 return isset($v['sucursal']) && $v['sucursal'] === $request->get('sucursal');
//             });
//         }

//         if ($request->filled('metodoPago')) {
//             $mp = $request->get('metodoPago');
//             $ventas = array_filter($ventas, function ($v) use ($mp) {
//                 if (!isset($v['metodos_pago'])) return false;
//                 return stripos(json_encode($v['metodos_pago']), $mp) !== false;
//             });
//         }

//         // Reindex
//         $ventas = array_values($ventas);

//         return response()->json(['data' => $ventas]);
//     }

//     public function show($id)
//     {
//         $ventas = Session::get('mock_ventas', []);
//         foreach ($ventas as $v) {
//             if ($v['id'] == $id) {
//                 return response()->json(['data' => $v]);
//             }
//         }
//         return response()->json(['message' => 'Venta no encontrada'], 404);
//     }

//     public function store(Request $request)
//     {
//         $data = $request->all();

//         // Log payload to help debug why ventas are not being guardadas
//         Log::info('Venta store payload', $data);

//         $validator = Validator::make($data, [
//             'fecha' => 'required|date',
//             'sucursal' => 'required|string',
//             'items' => 'required|array|min:1',
//         ]);

//         if ($validator->fails()) {
//             return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
//         }

//         $ventas = Session::get('mock_ventas', []);

//         $id = time() . rand(100, 999);

//         $subtotal = 0;
//         foreach ($data['items'] as $it) {
//             $cantidad = isset($it['cantidad']) ? (float)$it['cantidad'] : 1;
//             $precio = isset($it['precioUnitario']) ? (float)$it['precioUnitario'] : 0;
//             $subtotal += $cantidad * $precio;
//         }

//         $iva = isset($data['iva']) ? (float)$data['iva'] : round($subtotal * 0.19, 2);
//         $total = isset($data['total']) ? (float)$data['total'] : round($subtotal + $iva, 2);

//         // Intentar persistir en BD (transacción). Si falla, usar el fallback a archivo/sesión.
//         $ventaSaved = null;
//         $dbError = null;
//         DB::beginTransaction();
//         try {
//             // Mapear los tipos enviados ('efectivo','transferencia','debito','credito','cheque','online','credito_deuda')
//             // a los valores del ENUM existentes en la base de datos
//             $map = [
//                 'efectivo' => 'Efectivo',
//                 'transferencia' => 'Transferencia',
//                 'debito' => 'Tarjeta Debito',
//                 'credito' => 'Tarjeta Credito',
//                 'cheque' => 'Cheque',
//                 'online' => 'Pago Online',
//                 'credito_deuda' => 'Credito (Deuda)'
//             ];

//             $primaryTipo = null;
//             if (!empty($data['metodoPago1']['tipo'])) $primaryTipo = $data['metodoPago1']['tipo'];
//             if (empty($primaryTipo) && !empty($data['metodoPago2']['tipo'])) $primaryTipo = $data['metodoPago2']['tipo'];

//             $metodoPagoEnum = $map[$primaryTipo] ?? null;

//             $ventaModel = Venta::create([
//                 'fecha' => $data['fecha'],
//                 'sucursal_id' => $data['sucursal'] ?? null,
//                 'sucursal_nombre' => isset($data['sucursal']) && is_string($data['sucursal']) ? $data['sucursal'] : null,
//                 'cliente_id' => $data['cliente'] ?? null,
//                 'documentoVenta' => $data['documentoVenta'] ?? null,
//                 'folioVenta' => $data['folioVenta'] ?? null,
//                 'subtotal' => $subtotal,
//                 'iva' => $iva,
//                 'total' => $total,
//                 // Guardar valor compatible con ENUM actual para evitar truncamiento
//                 'metodos_pago' => $metodoPagoEnum,
//                 // Guardar detalle completo en columna nueva (JSON/Text)
//                 'metodos_pago_detalle' => [$data['metodoPago1'] ?? [], $data['metodoPago2'] ?? []],
//                 'observaciones' => $data['observaciones'] ?? null,
//                 'estado' => $data['estado'] ?? 'REGISTRADA',
//             ]);

//             foreach ($data['items'] as $it) {
//                 $cantidad = isset($it['cantidad']) ? (float)$it['cantidad'] : 1;
//                 $precio = isset($it['precioUnitario']) ? (float)$it['precioUnitario'] : 0;
//                 $total_linea = round($cantidad * $precio, 2);

//                 VentaDetalle::create([
//                     'venta_id' => $ventaModel->id,
//                     'descripcion' => $it['descripcion'] ?? null,
//                     'cantidad' => $cantidad,
//                     'precio_unitario' => $precio,
//                     'total_linea' => $total_linea,
//                 ]);
//             }

//             DB::commit();
//             $ventaSaved = $ventaModel->load('detalles');
//         } catch (\Exception $e) {
//             DB::rollBack();
//             Log::error('Error saving venta to DB', [
//                 'message' => $e->getMessage(),
//                 'trace' => $e->getTraceAsString(),
//                 'payload' => $data,
//             ]);
//             $dbError = $e->getMessage();
//             // fallback: guardar en sesión/archivo
//             $venta = [
//                 'id' => $id,
//                 'fecha' => $data['fecha'],
//                 'sucursal' => $data['sucursal'],
//                 'documentoVenta' => $data['documentoVenta'] ?? null,
//                 'folioVenta' => $data['folioVenta'] ?? null,
//                 'cliente' => $data['cliente'] ?? null,
//                 'items' => $data['items'],
//                 'subtotal' => $subtotal,
//                 'iva' => $iva,
//                 'total' => $total,
//                 'metodos_pago' => [$data['metodoPago1'] ?? [], $data['metodoPago2'] ?? []],
//                 'observaciones' => $data['observaciones'] ?? null,
//                 'estado' => $data['estado'] ?? 'REGISTRADA',
//                 'created_at' => now()->toDateTimeString(),
//             ];

//             $ventas[] = $venta;
//             Session::put('mock_ventas', $ventas);
//             try {
//                 $path = storage_path('app/mock_ventas.json');
//                 $existing = [];
//                 if (file_exists($path)) {
//                     $existing = json_decode(file_get_contents($path), true) ?: [];
//                 }
//                 $existing[] = $venta;
//                 file_put_contents($path, json_encode($existing, JSON_PRETTY_PRINT));
//             } catch (\Exception $e2) {
//                 // ignore
//             }
//         }

//         if ($ventaSaved) {
//             return response()->json(['data' => $ventaSaved, 'saved_in_db' => true], 201);
//         }

//         return response()->json(['data' => $venta, 'saved_in_db' => false, 'error' => $dbError], 201);
//     }

//     public function update(Request $request, $id)
//     {
//         $ventas = Session::get('mock_ventas', []);
//         $found = false;
//         foreach ($ventas as &$v) {
//             if ($v['id'] == $id) {
//                 $v = array_merge($v, $request->all());
//                 $found = true;
//                 break;
//             }
//         }
//         if (!$found) return response()->json(['message' => 'Venta no encontrada'], 404);
//         Session::put('mock_ventas', $ventas);
//         return response()->json(['data' => $v]);
//     }

//     public function destroy($id)
//     {
//         $ventas = Session::get('mock_ventas', []);
//         $new = [];
//         $deleted = null;
//         foreach ($ventas as $v) {
//             if ($v['id'] == $id) {
//                 $deleted = $v;
//                 continue;
//             }
//             $new[] = $v;
//         }
//         Session::put('mock_ventas', $new);
//         if (!$deleted) return response()->json(['message' => 'Venta no encontrada'], 404);
//         return response()->json(['message' => 'Venta eliminada', 'data' => $deleted]);
//     }

//     public function export(Request $request)
//     {
//         $ventas = $this->index($request)->getData()->data;

//         $response = new StreamedResponse(function () use ($ventas) {
//             $out = fopen('php://output', 'w');
//             fputcsv($out, ['id', 'fecha', 'sucursal', 'subtotal', 'iva', 'total', 'observaciones']);
//             foreach ($ventas as $v) {
//                 fputcsv($out, [
//                     $v->id ?? $v['id'] ?? '',
//                     $v->fecha ?? '',
//                     $v->sucursal ?? '',
//                     $v->subtotal ?? '',
//                     $v->iva ?? '',
//                     $v->total ?? '',
//                     $v->observaciones ?? '',
//                 ]);
//             }
//             fclose($out);
//         });

//         $filename = 'ventas_export_' . date('Ymd_His') . '.csv';

//         $response->headers->set('Content-Type', 'text/csv');
//         $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');

//         return $response;
//     }
// }

<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\VentaDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VentasController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 50);

        $query = Venta::with(['detalles', 'cliente'])->orderBy('fecha', 'desc');

        // Filtros: fecha (YYYY-MM-DD), sucursal (id o nombre), metodoPago (literal)
        if ($request->filled('fecha')) {
            $date = $request->get('fecha');
            $query->whereDate('fecha', $date);
        }

        if ($request->filled('sucursal')) {
            $s = $request->get('sucursal');
            if (is_numeric($s)) {
                $query->where('sucursal_id', $s);
            } else {
                $query->where(function($q) use ($s) {
                    $q->where('sucursal_nombre', $s)
                      ->orWhere('sucursal', $s);
                });
            }
        }

        if ($request->filled('metodoPago')) {
            $mp = $request->get('metodoPago');
            $query->where(function($q) use ($mp) {
                $q->where('metodos_pago', $mp);

                // Añadir búsqueda en tabla `venta_metodos_pago` sólo si existe
                try {
                    if (Schema::hasTable('venta_metodos_pago')) {
                        $q->orWhereRaw(
                            "EXISTS(SELECT 1 FROM venta_metodos_pago vmp WHERE vmp.venta_id = ventas.id AND vmp.metodos LIKE ?)",
                            ["%\"tipo\":\"{$mp}\"%"]
                        );
                    } else {
                        // tabla no existe -> evitar SQL que cause error
                        Log::warning('Tabla venta_metodos_pago no encontrada; omitido subquery de metodos de pago');
                    }
                } catch (\Exception $e) {
                    // En caso de algún error inesperado con Schema, no romper la consulta
                    Log::warning('Error comprobando tabla venta_metodos_pago: ' . $e->getMessage());
                }
            });
        }

        $ventas = $query->with('sucursal')->paginate($perPage);

        // Asegurar que `sucursal_nombre` esté poblado (fallback a relación `sucursal.nombre` si existe)
        $ventas->getCollection()->transform(function ($v) {
            if (empty($v->sucursal_nombre)) {
                if ($v->relationLoaded('sucursal') && $v->sucursal) {
                    $v->sucursal_nombre = $v->sucursal->nombre;
                }
            }
            return $v;
        });

        return response()->json($ventas);
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

        Log::info('VentasController@store payload', $data);

        $validator = Validator::make($data, [
            'fecha' => 'required|date',
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
            // Compatibilidad: aceptar `metodo_pago` (literal) o `metodos_pago` (legacy)
            $metodoPago = $data['metodo_pago'] ?? ($data['metodos_pago'] ?? null);
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
            ];

            // Guardamos el literal en la columna `metodos_pago`.
            // Normalizar metodos_pago según el tipo de columna en la BD.
            if ($columnType === 'enum') {
                // intentar obtener literales permitidos desde la definición de la columna
                $allowed = null;
                try {
                    $rows = DB::select("SHOW COLUMNS FROM ventas WHERE Field = 'metodos_pago'");
                    if (!empty($rows) && isset($rows[0]->Type)) {
                        $typeDef = $rows[0]->Type; // ejemplo: enum('Efectivo','Transferencia',...)
                        preg_match_all("/'([^']+)'/", $typeDef, $m);
                        $allowed = $m[1] ?? null;
                    }
                } catch (\Exception $e) {
                    Log::warning('No se pudo leer definición de columna metodos_pago: ' . $e->getMessage());
                }

                // obtener un valor candidato desde el payload (manejar array/obj/object/string)
                $candidate = null;
                if (is_array($metodoPago)) {
                    $first = $metodoPago[0] ?? null;
                    if (is_array($first) || is_object($first)) {
                        $candidate = $first['tipo'] ?? ($first->tipo ?? null);
                    } else {
                        $candidate = is_string($first) ? $first : null;
                    }
                } elseif (is_object($metodoPago)) {
                    $candidate = $metodoPago->tipo ?? null;
                } else {
                    $candidate = is_string($metodoPago) ? $metodoPago : null;
                }

                // si tenemos lista de permitidos, buscar coincidencia case-insensitive
                $final = null;
                if (is_array($allowed) && $candidate) {
                    foreach ($allowed as $a) {
                        if (mb_strtolower($a) === mb_strtolower($candidate)) { $final = $a; break; }
                        // permitir coincidencias parciales (ej. 'efectivo' vs 'Efectivo')
                        if (mb_stripos($a, (string)$candidate) !== false) { $final = $a; break; }
                    }
                }

                // si no encontramos, intentar mapear por términos comunes
                if (!$final && $candidate) {
                    $map = [
                        'efectivo' => ['efectivo','efec','cash'],
                        'transferencia' => ['transferencia','transfer','tran'],
                        'cheque' => ['cheque','check'],
                        'tarjeta credito' => ['credito','tarjeta credito','tarjeta_credito','card_credit'],
                        'tarjeta debito' => ['debito','tarjeta debito','tarjeta_debito','card_debit'],
                        'pago online' => ['online','pago online','webpay','online_payment'],
                        'credito (deuda)' => ['credito_deuda','credito','deuda']
                    ];
                    $c = mb_strtolower((string)$candidate);
                    foreach ($map as $literal => $aliases) {
                        foreach ($aliases as $alias) {
                            if (mb_stripos($c, $alias) !== false) {
                                // buscar literal real en allowed que contenga $literal
                                if (is_array($allowed)) {
                                    foreach ($allowed as $a) {
                                        if (mb_stripos(mb_strtolower($a), mb_strtolower($literal)) !== false) { $final = $a; break 2; }
                                    }
                                }
                            }
                        }
                    }
                }

                // si al final no coincide con enum permitido, dejamos null para evitar error SQL
                $ventaPayload['metodos_pago'] = $final ?? null;
            } else {
                // columna json u otro tipo: guardar tal cual (permitir arrays/objetos)
                $ventaPayload['metodos_pago'] = $metodoPago;
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

            // Si viene un detalle de métodos (legacy array), guardarlo también en tabla separada
            if ($metodosPagoDetalle === null && isset($data['metodos_pago']) && is_array($data['metodos_pago'])) {
                $metodosPagoDetalle = $data['metodos_pago'];
            }

            if (!empty($metodosPagoDetalle) && is_array($metodosPagoDetalle)) {
                try {
                    DB::table('venta_metodos_pago')->insert([
                        'venta_id' => $venta->id,
                        'metodos' => json_encode($metodosPagoDetalle, JSON_UNESCAPED_UNICODE),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Error inserting venta_metodos_pago', ['error' => $e->getMessage(), 'payload' => $metodosPagoDetalle]);
                }
            }

            DB::commit();
            return response()->json($venta->load('detalles'), 201);
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

            

    public function update(Request $request, $id)
    {
        $venta = Venta::find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
        }

        $data = $request->all();
        $validator = Validator::make($data, [
            'fecha' => 'sometimes|date',
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
            // Aceptar `metodo_pago` (literal) o `metodos_pago` (legacy array/string)
            $metodoPago = $data['metodo_pago'] ?? ($data['metodos_pago'] ?? ($venta->metodos_pago ?? null));
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

            if (!empty($metodoPago)) {
                Log::info('VentasController@update: metodo_pago recibido', [
                    'metodo_pago' => $metodoPago,
                    'columnType' => $columnType,
                    'venta_id' => $id,
                ]);
            }

            // Normalizar metodos_pago para evitar pasar arrays a columnas ENUM
            if ($columnType === 'enum') {
                // intentar obtener literales permitidos desde la definición de la columna
                $allowed = null;
                try {
                    $rows = DB::select("SHOW COLUMNS FROM ventas WHERE Field = 'metodos_pago'");
                    if (!empty($rows) && isset($rows[0]->Type)) {
                        $typeDef = $rows[0]->Type; // ejemplo: enum('Efectivo','Transferencia',...)
                        preg_match_all("/'([^']+)'/", $typeDef, $m);
                        $allowed = $m[1] ?? null;
                    }
                } catch (\Exception $e) {
                    Log::warning('No se pudo leer definición de columna metodos_pago: ' . $e->getMessage());
                }

                // obtener un valor candidato desde el payload (manejar array/obj/object/string)
                $candidate = null;
                if (is_array($metodoPago)) {
                    $first = $metodoPago[0] ?? null;
                    if (is_array($first) || is_object($first)) {
                        $candidate = $first['tipo'] ?? ($first->tipo ?? null);
                    } else {
                        $candidate = is_string($first) ? $first : null;
                    }
                } elseif (is_object($metodoPago)) {
                    $candidate = $metodoPago->tipo ?? null;
                } else {
                    $candidate = is_string($metodoPago) ? $metodoPago : null;
                }

                // si tenemos lista de permitidos, buscar coincidencia case-insensitive
                $final = null;
                if (is_array($allowed) && $candidate) {
                    foreach ($allowed as $a) {
                        if (mb_strtolower($a) === mb_strtolower($candidate)) { $final = $a; break; }
                        // permitir coincidencias parciales (ej. 'efectivo' vs 'Efectivo')
                        if (mb_stripos($a, (string)$candidate) !== false) { $final = $a; break; }
                    }
                }

                // si no encontramos, intentar mapear por términos comunes
                if (!$final && $candidate) {
                    $map = [
                        'efectivo' => ['efectivo','efec','cash'],
                        'transferencia' => ['transferencia','transfer','tran'],
                        'cheque' => ['cheque','check'],
                        'tarjeta credito' => ['credito','tarjeta credito','tarjeta_credito','card_credit'],
                        'tarjeta debito' => ['debito','tarjeta debito','tarjeta_debito','card_debit'],
                        'pago online' => ['online','pago online','webpay','online_payment'],
                        'credito (deuda)' => ['credito_deuda','credito','deuda']
                    ];
                    $c = mb_strtolower((string)$candidate);
                    foreach ($map as $literal => $aliases) {
                        foreach ($aliases as $alias) {
                            if (mb_stripos($c, $alias) !== false) {
                                // buscar literal real en allowed que contenga $literal
                                if (is_array($allowed)) {
                                    foreach ($allowed as $a) {
                                        if (mb_stripos(mb_strtolower($a), mb_strtolower($literal)) !== false) { $final = $a; break 2; }
                                    }
                                }
                            }
                        }
                    }
                }

                // si al final no coincide con enum permitido, dejamos null para evitar error SQL
                $updatePayload['metodos_pago'] = $final ?? null;
            } else {
                $updatePayload['metodos_pago'] = $metodoPago;
            }

            $venta->update($updatePayload);

            // Preparar metodosPagoDetalle si viene en request (legacy)
            if ($metodosPagoDetalle === null && isset($data['metodos_pago']) && is_array($data['metodos_pago'])) {
                $metodosPagoDetalle = $data['metodos_pago'];
            }

            // Persistir/actualizar métodos de pago en tabla separada
            try {
                if (!empty($metodosPagoDetalle) && is_array($metodosPagoDetalle)) {
                    $existing = DB::table('venta_metodos_pago')->where('venta_id', $venta->id)->first();
                    if ($existing) {
                        DB::table('venta_metodos_pago')->where('venta_id', $venta->id)->update([
                            'metodos' => json_encode($metodosPagoDetalle, JSON_UNESCAPED_UNICODE),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::table('venta_metodos_pago')->insert([
                            'venta_id' => $venta->id,
                            'metodos' => json_encode($metodosPagoDetalle, JSON_UNESCAPED_UNICODE),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Error updating/inserting venta_metodos_pago', ['error' => $e->getMessage(), 'venta_id' => $venta->id, 'payload' => $metodosPagoDetalle]);
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
            return response()->json($venta->load('detalles'));
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

    public function destroy($id)
    {
        $venta = Venta::find($id);
        if (!$venta) {
            return response()->json(['message' => 'Venta no encontrada'], 404);
        }

        DB::beginTransaction();
        try {
            // eliminar detalles manualmente para asegurar limpieza
            $venta->detalles()->delete();
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
            $rows = DB::table('venta_metodos_pago')->orderBy('id', 'desc')->limit(20)->get();
            return response()->json($rows);
        } catch (\Exception $e) {
            Log::error('VentasController@debugMetodos error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error reading venta_metodos_pago', 'error' => $e->getMessage()], 500);
        }
    }
}

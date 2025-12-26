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
        $ventas = Venta::with(['detalles', 'cliente'])->orderBy('fecha', 'desc')->paginate($perPage);
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

            // Persistir el método de pago recibido (literal) en la columna `ventas.metodos_pago`.
            if (!empty($metodoPago)) {
                Log::info('VentasController@store: metodo_pago recibido', [
                    'metodo_pago' => $metodoPago,
                    'columnType' => $columnType,
                ]);
            }

            // Guardamos el literal en la columna `metodos_pago`.
            $ventaPayload['metodos_pago'] = $metodoPago;

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

            $updatePayload['metodos_pago'] = $metodoPago;

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

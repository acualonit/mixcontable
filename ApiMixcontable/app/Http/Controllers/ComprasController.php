<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\CompraDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ComprasController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 50);

        $query = Compra::with(['detalles', 'proveedor', 'sucursal'])
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('fecha')) {
            $query->whereDate('fecha', $request->get('fecha'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->get('estado'));
        }

        if ($request->filled('proveedor_id')) {
            $query->where('proveedor_id', $request->get('proveedor_id'));
        }

        if ($request->filled('tipo_documento')) {
            $query->where('tipo_documento', $request->get('tipo_documento'));
        }

        if ($request->filled('sucursal_id')) {
            $val = $request->get('sucursal_id');
            // Evitar usar columnas que no existen en la tabla; soportar `sucursal_id` o `id_sucursal`
            $hasA = Schema::hasColumn('compras', 'sucursal_id');
            $hasB = Schema::hasColumn('compras', 'id_sucursal');
            if ($hasA && $hasB) {
                $query->where(function($q) use ($val) {
                    $q->where('sucursal_id', $val)->orWhere('id_sucursal', $val);
                });
            } elseif ($hasA) {
                $query->where('sucursal_id', $val);
            } elseif ($hasB) {
                $query->where('id_sucursal', $val);
            } // si ninguna existe, no filtrar
        }

        try {
            $result = $query->paginate($perPage);
            return response()->json($result);
        } catch (\Illuminate\Database\QueryException $e) {
            // Si la consulta falló por columna inexistente (sucursal_id), intentamos una segunda pasada
            Log::warning('ComprasController@index query exception, reintentando con id_sucursal', ['error' => $e->getMessage()]);

            // reconstruir consulta conservando filtros excepto el uso de `sucursal_id`
            $query2 = Compra::with(['detalles', 'proveedor', 'sucursal'])
                ->orderBy('fecha', 'desc')
                ->orderBy('id', 'desc');

            if ($request->filled('fecha')) {
                $query2->whereDate('fecha', $request->get('fecha'));
            }
            if ($request->filled('estado')) {
                $query2->where('estado', $request->get('estado'));
            }
            if ($request->filled('proveedor_id')) {
                $query2->where('proveedor_id', $request->get('proveedor_id'));
            }
            if ($request->filled('tipo_documento')) {
                $query2->where('tipo_documento', $request->get('tipo_documento'));
            }

            // reintentar sólo con id_sucursal
            if ($request->filled('sucursal_id')) {
                $val = $request->get('sucursal_id');
                $query2->where('id_sucursal', $val);
            }

            try {
                $result2 = $query2->paginate($perPage);
                return response()->json($result2);
            } catch (\Exception $e2) {
                Log::error('ComprasController@index fallback failed', ['error' => $e2->getMessage(), 'trace' => $e2->getTraceAsString()]);
                return response()->json(['message' => 'Error interno consultando compras', 'error' => $e2->getMessage()], 500);
            }
        }
    }

    public function eliminadas(Request $request)
    {
        $perPage = $request->get('per_page', 50);

        $query = Compra::onlyTrashed()->with(['proveedor', 'sucursal'])->orderBy('deleted_at', 'desc');

        if ($request->filled('mes')) {
            // mes formato YYYY-MM
            $mes = $request->get('mes');
            $query->whereRaw("DATE_FORMAT(deleted_at, '%Y-%m') = ?", [$mes]);
        }

        return response()->json($query->paginate($perPage));
    }

    public function show($id)
    {
        $compra = Compra::with(['detalles', 'proveedor', 'sucursal'])->find($id);
        if (!$compra) {
            return response()->json(['message' => 'Compra no encontrada'], 404);
        }

        // Construir historial básico: una entrada de creación y, si cambió, una de edición
        $historial = [];

        // Nombre creador: preferir columna explícita, luego buscar user id
        $creatorName = null;
        if (isset($compra->created_by_name) && $compra->created_by_name) {
            $creatorName = $compra->created_by_name;
        } elseif (isset($compra->created_by) && $compra->created_by) {
            try {
                $u = \App\Models\User::find($compra->created_by);
                if ($u) $creatorName = $u->name;
            } catch (\Exception $e) {
                // ignore
            }
        }

        if ($compra->created_at) {
            $historial[] = [
                'fecha' => $compra->created_at->format('Y-m-d H:i:s'),
                'usuario' => $creatorName ?? 'Sistema',
                'accion' => 'Creada',
            ];
        }

        // Si hubo actualización posterior, añadir un único registro de 'Edición' con el usuario que actualizó
        if ($compra->updated_at && $compra->updated_at != $compra->created_at) {
            $editorName = null;
            if (isset($compra->updated_by_name) && $compra->updated_by_name) {
                $editorName = $compra->updated_by_name;
            } elseif (isset($compra->updated_by) && $compra->updated_by) {
                try {
                    $u2 = \App\Models\User::find($compra->updated_by);
                    if ($u2) $editorName = $u2->name;
                } catch (\Exception $e) {
                    // ignore
                }
            }

            $historial[] = [
                'fecha' => $compra->updated_at->format('Y-m-d H:i:s'),
                'usuario' => $editorName ?? ($compra->updated_by_name ?? 'Usuario'),
                'accion' => 'Edición',
            ];
        }

        // Si fue eliminada, incluir esa acción también
        if ($compra->deleted_at) {
            $historial[] = [
                'fecha' => $compra->deleted_at->format('Y-m-d H:i:s'),
                'usuario' => $compra->deleted_by_name ?? 'Sistema',
                'accion' => 'Eliminada',
            ];
        }

        $arr = $compra->toArray();
        $arr['historial'] = $historial;

        try {
            return response()->json($arr);
        } catch (\Exception $e) {
            Log::error('ComprasController@show error', ['id' => $id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Error interno obteniendo compra', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->all();

        // Log del payload para depuración
        try {
            Log::info('ComprasController@store payload', $data);
        } catch (\Throwable $e) {
            // no bloquear si logging falla
        }

        $validator = Validator::make($data, [
            'fecha' => 'required|date',
            'proveedor_id' => 'nullable|integer',
            'sucursal_id' => 'nullable|integer',
            'tipo_documento' => 'required|string|max:20',
            'folio' => 'nullable|string|max:50',

            'total_neto' => 'required|numeric',
            'total_impuesto' => 'required|numeric',
            'total_bruto' => 'required|numeric',

            'observaciones' => 'nullable|string',
            'estado' => 'nullable|string',

            'detalles' => 'required|array|min:1',
            'detalles.*.descripcion_item' => 'required|string',
            'detalles.*.cantidad' => 'required|numeric',
            'detalles.*.costo_unitario' => 'required|numeric',
            'detalles.*.descuento_porcentaje' => 'nullable|numeric',
            'detalles.*.impuesto_porcentaje' => 'nullable|numeric',
            'detalles.*.total_linea' => 'required|numeric',
            'fecha_final' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $createPayload = [
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'sucursal_id' => $data['sucursal_id'] ?? null,
                'fecha' => $data['fecha'],
                'tipo_documento' => $data['tipo_documento'],
                'folio' => $data['folio'] ?? null,
                'total_neto' => $data['total_neto'],
                'total_impuesto' => $data['total_impuesto'],
                'total_bruto' => $data['total_bruto'],
                'estado' => $data['estado'] ?? 'REGISTRADA',
                'observaciones' => $data['observaciones'] ?? null,
                // 'fecha_final' se añade abajo solo si la columna existe
            ];

            // Añadir fecha_final sólo si la columna existe para evitar SQL errors
            try {
                if (Schema::hasColumn('compras', 'fecha_final') && array_key_exists('fecha_final', $data)) {
                    $createPayload['fecha_final'] = $data['fecha_final'];
                }
            } catch (\Exception $e) {
                Log::warning('ComprasController@store: error comprobando columna fecha_final', ['error' => $e->getMessage()]);
            }

            // Si la tabla soporta campos de auditoría simples, registrar creador
            if (Schema::hasColumn('compras', 'created_by')) {
                $createPayload['created_by'] = Auth::id();
            }
            if (Schema::hasColumn('compras', 'created_by_name')) {
                $createPayload['created_by_name'] = Auth::user() ? Auth::user()->name : null;
            }

            // Si frontend envía un nombre de sucursal en lugar de id, intentar resolverlo
            if (isset($createPayload['sucursal_id']) && !is_numeric($createPayload['sucursal_id'])) {
                $sname = trim((string)$createPayload['sucursal_id']);
                try {
                    $found = DB::table('sucursales')->where('nombre', $sname)->orWhere('nombre_sucursal', $sname)->value('id');
                    if ($found) $createPayload['sucursal_id'] = $found;
                    else $createPayload['sucursal_id'] = null;
                } catch (\Exception $e) {
                    $createPayload['sucursal_id'] = null;
                }
            }

            $compra = Compra::create($createPayload);

            foreach ($data['detalles'] as $d) {
                $compra->detalles()->create([
                    'descripcion_item' => $d['descripcion_item'],
                    'cantidad' => $d['cantidad'],
                    'costo_unitario' => $d['costo_unitario'],
                    'descuento_porcentaje' => $d['descuento_porcentaje'] ?? 0,
                    'impuesto_porcentaje' => $d['impuesto_porcentaje'] ?? 0,
                    'total_linea' => $d['total_linea'],
                ]);
            }

            DB::commit();
            return response()->json($compra->load(['detalles', 'proveedor', 'sucursal']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            // Log detallado del error para facilitar depuración
            try {
                Log::error('ComprasController@store exception', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'payload' => $data]);
            } catch (\Throwable $ee) {
                // ignore logging errors
            }
            return response()->json([
                'message' => 'Error al crear compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $compra = Compra::find($id);
        if (!$compra) {
            return response()->json(['message' => 'Compra no encontrada'], 404);
        }

        $data = $request->all();

        $validator = Validator::make($data, [
            'fecha' => 'sometimes|date',
            'proveedor_id' => 'nullable|integer',
            'sucursal_id' => 'nullable|integer',
            'tipo_documento' => 'sometimes|string|max:20',
            'folio' => 'nullable|string|max:50',
            'total_neto' => 'sometimes|numeric',
            'total_impuesto' => 'sometimes|numeric',
            'total_bruto' => 'sometimes|numeric',
            'estado' => 'sometimes|string',
            'observaciones' => 'nullable|string',
            'fecha_final' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $compra->fill([ 
                'fecha' => $data['fecha'] ?? $compra->fecha,
                'proveedor_id' => array_key_exists('proveedor_id', $data) ? $data['proveedor_id'] : $compra->proveedor_id,
                'sucursal_id' => array_key_exists('sucursal_id', $data) ? $data['sucursal_id'] : $compra->sucursal_id,
                'tipo_documento' => $data['tipo_documento'] ?? $compra->tipo_documento,
                'folio' => array_key_exists('folio', $data) ? $data['folio'] : $compra->folio,
                'total_neto' => $data['total_neto'] ?? $compra->total_neto,
                'total_impuesto' => $data['total_impuesto'] ?? $compra->total_impuesto,
                'total_bruto' => $data['total_bruto'] ?? $compra->total_bruto,
                'estado' => $data['estado'] ?? $compra->estado,
                'observaciones' => array_key_exists('observaciones', $data) ? $data['observaciones'] : $compra->observaciones,
                // 'fecha_final' se maneja abajo condicionalmente
            ]);

            // Añadir fecha_final sólo si la columna existe
            try {
                if (Schema::hasColumn('compras', 'fecha_final') && array_key_exists('fecha_final', $data)) {
                    $compra->fecha_final = $data['fecha_final'];
                }
            } catch (\Exception $e) {
                Log::warning('ComprasController@update: error comprobando columna fecha_final', ['error' => $e->getMessage()]);
            }

            $compra->save();

            // Si frontend envía sucursal como nombre en el payload original, resolver antes de guardar
            if (array_key_exists('sucursal_id', $data) && !is_numeric($data['sucursal_id'])) {
                $sname = trim((string)$data['sucursal_id']);
                try {
                    $found = DB::table('sucursales')->where('nombre', $sname)->orWhere('nombre_sucursal', $sname)->value('id');
                    if ($found) {
                        $compra->sucursal_id = $found;
                        $compra->save();
                    }
                } catch (\Exception $e) {
                    // ignore
                }
            }

            // Si vienen detalles, reemplazarlos: eliminamos los existentes y creamos los nuevos
            if (isset($data['detalles']) && is_array($data['detalles'])) {
                // soft-delete existing detalles
                $compra->detalles()->delete();
                foreach ($data['detalles'] as $d) {
                    $compra->detalles()->create([
                        'descripcion_item' => $d['descripcion_item'] ?? $d['descripcion'] ?? '',
                        'cantidad' => $d['cantidad'] ?? 0,
                        'costo_unitario' => $d['costo_unitario'] ?? $d['precio_unitario'] ?? 0,
                        'descuento_porcentaje' => $d['descuento_porcentaje'] ?? 0,
                        'impuesto_porcentaje' => $d['impuesto_porcentaje'] ?? 0,
                        'total_linea' => $d['total_linea'] ?? 0,
                    ]);
                }
            }

            // Registrar usuario que actualizó (si la columna existe)
            if (Schema::hasColumn('compras', 'updated_by')) {
                $compra->updated_by = Auth::id();
            }
            if (Schema::hasColumn('compras', 'updated_by_name')) {
                $compra->updated_by_name = Auth::user() ? Auth::user()->name : null;
            }
            $compra->save();

            DB::commit();
            return response()->json($compra->load(['detalles', 'proveedor', 'sucursal']));
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ComprasController@update error', ['id' => $id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'payload' => $data]);
            return response()->json([
                'message' => 'Error al actualizar compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $compra = Compra::find($id);
        if (!$compra) {
            return response()->json(['message' => 'Compra no encontrada'], 404);
        }

        // Registrar quién elimina si la tabla soporta esas columnas
        try {
            if (Schema::hasColumn('compras', 'deleted_by')) {
                $compra->deleted_by = \Illuminate\Support\Facades\Auth::id();
            }
            if (Schema::hasColumn('compras', 'deleted_by_name')) {
                $compra->deleted_by_name = \Illuminate\Support\Facades\Auth::user() ? \Illuminate\Support\Facades\Auth::user()->name : null;
            }
            $compra->save();
        } catch (\Exception $e) {
            // ignore issues saving audit fields
        }

        // Soft delete
        $compra->delete();

        return response()->json(['ok' => true]);
    }
}

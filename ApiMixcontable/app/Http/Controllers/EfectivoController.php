<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use App\Services\CajaSaldoService;

class EfectivoController extends Controller
{
    // Devuelve el saldo calculado a partir de movimientos
    public function saldo(Request $request)
    {
        // permitir especificar caja_id por query param, por defecto 1
        $cajaId = (int)($request->get('caja_id') ?? 1);

        // Forzar recomputo para que caja_efectivo.saldo_actual esté actualizado
        try {
            CajaSaldoService::recomputeSaldoActual($cajaId);
        } catch (\Throwable $e) {
            Log::warning('EfectivoController::saldo recompute fallo', ['error' => $e->getMessage(), 'caja_id' => $cajaId]);
        }

        // Intentar leer saldo desde tabla caja_efectivo (preferir saldo_actual)
        try {
            $colsCaja = Schema::getColumnListing('caja_efectivo');
        } catch (\Throwable $e) {
            $colsCaja = [];
        }

        $saldoCol = null;
        if (in_array('saldo_actual', $colsCaja)) {
            $saldoCol = 'saldo_actual';
        } elseif (in_array('saldo_inicial', $colsCaja)) {
            $saldoCol = 'saldo_inicial';
        }

        if ($saldoCol) {
            try {
                $saldoVal = DB::table('caja_efectivo')->where('id', $cajaId)->value($saldoCol);
                if ($saldoVal === null) $saldoVal = 0.0;
                return response()->json(['saldo' => (float)$saldoVal]);
            } catch (\Throwable $e) {
                Log::error('EfectivoController: error leyendo caja_efectivo saldo', ['error' => $e->getMessage(), 'caja_id' => $cajaId, 'col' => $saldoCol]);
                // continuar al fallback
            }
        }

        // Fallback: calcular saldo a partir de movimientos_caja (mismo comportamiento anterior)
        $cols = Schema::getColumnListing('movimientos_caja');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) {
                if (in_array($c, $cols)) return $c;
            }
            foreach ($cols as $col) {
                foreach ($candidates as $c) {
                    if (stripos($col, $c) !== false) return $col;
                }
            }
            return null;
        };

        $typeCol = $pick(['tipo', 'tipo_movimiento', 'movement_type', 'type']);
        $amountCol = $pick(['monto', 'valor', 'importe', 'amount']);

        if (!$typeCol || !$amountCol) {
            Log::error('EfectivoController: columnas tipo/monto no detectadas', ['cols' => $cols]);
            return response()->json(['saldo' => 0.0]);
        }

        $sql = "COALESCE(SUM(CASE WHEN `".$typeCol."` = 'ingreso' THEN `".$amountCol."` WHEN `".$typeCol."` = 'egreso' THEN -`".$amountCol."` ELSE 0 END),0) as saldo";

        $query = DB::table('movimientos_caja')->selectRaw($sql)->where(function($q) use ($cajaId, $cols) {
            // si existe columna caja_id en movimientos_caja filtrar por caja
            if (in_array('caja_id', $cols)) {
                $q->where('caja_id', $cajaId);
            }
        });

        if (in_array('deleted_at', $cols)) {
            $query->whereNull('movimientos_caja.deleted_at');
        }

        $saldo = $query->value('saldo');

        return response()->json(['saldo' => (float)$saldo]);
    }

    // Lista de movimientos
    public function movimientos()
    {
        $cols = Schema::getColumnListing('movimientos_caja');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) {
                if (in_array($c, $cols)) return $c;
            }
            foreach ($cols as $col) {
                foreach ($candidates as $c) {
                    if (stripos($col, $c) !== false) return $col;
                }
            }
            return null;
        };

        $dateCol = $pick(['fecha', 'date', 'fecha_mov', 'created_at']);

            $query = DB::table('movimientos_caja');
        if (in_array('deleted_at', $cols)) {
                $query->whereNull('movimientos_caja.deleted_at');
        }
            if ($dateCol) {
                $query->orderBy('movimientos_caja.'.$dateCol, 'desc');
            } else if (in_array('id', $cols)) {
                $query->orderBy('movimientos_caja.id', 'desc');
        }

        // incluir nombre de usuario si existe tabla users (construir COALESCE solo con columnas existentes)
        $userCols = Schema::hasTable('users') ? Schema::getColumnListing('users') : [];
        if (!empty($userCols)) {
            $candidates = [];
            foreach (['name', 'nombre', 'nombre_completo', 'email'] as $uc) {
                if (in_array($uc, $userCols)) $candidates[] = "users.$uc";
            }
            $selectUserExpr = "'' as usuario_nombre";
            if (!empty($candidates)) {
                $selectUserExpr = 'COALESCE(' . implode(', ', $candidates) . ') as usuario_nombre';
            }
            $query->leftJoin('users', 'movimientos_caja.user_id', '=', 'users.id')
                  ->select('movimientos_caja.*', DB::raw($selectUserExpr));
        } else {
            $query->select('movimientos_caja.*');
        }

        $movimientos = $query->get();

        return response()->json(['data' => $movimientos]);
    }

    // Lista de movimientos eliminados (soft-deleted)
    public function eliminados()
    {
        $cols = Schema::getColumnListing('movimientos_caja');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) {
                if (in_array($c, $cols)) return $c;
            }
            foreach ($cols as $col) {
                foreach ($candidates as $c) {
                    if (stripos($col, $c) !== false) return $col;
                }
            }
            return null;
        };

        $dateCol = $pick(['fecha', 'date', 'fecha_mov', 'created_at']);
        $deletedCol = $pick(['deleted_at', 'deletedAt', 'fecha_eliminacion']);

        $query = DB::table('movimientos_caja');
        if ($deletedCol) {
            $query->whereNotNull('movimientos_caja.'.$deletedCol);
        } else {
            // si no hay columna deleted_at, devolver vacío
            return response()->json(['data' => []]);
        }

        if ($dateCol) $query->orderBy('movimientos_caja.'.$dateCol, 'desc');

        // incluir nombre de usuario si existe tabla users (construir COALESCE solo con columnas existentes)
        $userCols = Schema::hasTable('users') ? Schema::getColumnListing('users') : [];
        if (!empty($userCols)) {
            $candidates = [];
            foreach (['name', 'nombre', 'nombre_completo', 'email'] as $uc) {
                if (in_array($uc, $userCols)) $candidates[] = "users.$uc";
            }
            $selectUserExpr = "'' as usuario_nombre";
            if (!empty($candidates)) {
                $selectUserExpr = 'COALESCE(' . implode(', ', $candidates) . ') as usuario_nombre';
            }
            $query->leftJoin('users', 'movimientos_caja.user_id', '=', 'users.id')
                  ->select('movimientos_caja.*', DB::raw($selectUserExpr));
        } else {
            $query->select('movimientos_caja.*');
        }

        $rows = $query->get();
        return response()->json(['data' => $rows]);
    }

    // Crear nuevo movimiento
    public function store(Request $request)
    {
        $data = $request->validate([
            'fecha' => ['required', 'date'],
            'detalle' => ['required', 'string'],
            'tipo' => ['required', 'in:ingreso,egreso'],
            'monto' => ['required', 'numeric'],
            'categoria' => ['nullable', 'string'],
            'sucursal' => ['nullable'],
            'usuario' => ['nullable', 'integer']
        ]);

        // Obtener columnas reales de la tabla para mapear campos
        $cols = Schema::getColumnListing('movimientos_caja');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) {
                if (in_array($c, $cols)) return $c;
            }
            // intentar coincidencia por substring
            foreach ($cols as $col) {
                foreach ($candidates as $c) {
                    if (stripos($col, $c) !== false) return $col;
                }
            }
            return null;
        };

        $mapping = [
            'fecha' => $pick(['fecha', 'date', 'fecha_mov']),
            'detalle' => $pick(['detalle', 'descripcion', 'concepto', 'detalle_mov', 'descripcion_mov']),
            'tipo' => $pick(['tipo', 'tipo_movimiento', 'movement_type', 'type']),
            'monto' => $pick(['monto', 'valor', 'importe', 'amount']),
            'categoria' => $pick(['categoria', 'category']),
            'sucursal' => $pick(['sucursal', 'branch', 'sucursal_id']),
            'usuario' => $pick(['usuario', 'user', 'usuario_id', 'user_id']),
            'caja_id' => $pick(['caja_id', 'caja', 'cashbox', 'cajaId'])
        ];

        $insert = [];
        // Determinar user_id: preferir usuario autenticado, si existe
        $authenticatedUserId = null;
        try {
            $u = $request->user();
            if ($u && isset($u->id)) $authenticatedUserId = $u->id;
        } catch (\Throwable $e) {
            $authenticatedUserId = null;
        }

        foreach ($mapping as $key => $col) {
            if ($col) {
                $value = null;
                if ($key === 'usuario') {
                    // si existe usuario autenticado, usarlo; sino usar valor del payload
                    $value = $authenticatedUserId ?? ($data['usuario'] ?? null);
                } else {
                    $value = $data[$key] ?? null;
                }
                // convertir monto a float si aplica
                if ($key === 'monto' && $value !== null) $value = (float)$value;
                $insert[$col] = $value;
            }
        }

        // Asegurar valor válido para enum tipo_movimiento: la tabla usa 'EGRESO'/'INGRESO'
        if (!empty($mapping['tipo']) && isset($data['tipo'])) {
            $typeColName = $mapping['tipo'];
            $val = strtoupper($data['tipo']);
            // normalizar texto común: 'EGRESO'/'INGRESO'
            if ($val === 'EGRESO' || $val === 'EGRESO') {
                $insert[$typeColName] = 'EGRESO';
            } elseif ($val === 'INGRESO' || $val === 'INGRESO') {
                $insert[$typeColName] = 'INGRESO';
            } else {
                $insert[$typeColName] = $val;
            }
        }

        // Si existe columna caja_id y no se proporcionó, usar valor por defecto 1
        if (!empty($mapping['caja_id']) && empty($insert[$mapping['caja_id']])) {
            $insert[$mapping['caja_id']] = 1;
        }

        // timestamps si existen
        if (in_array('created_at', $cols)) $insert['created_at'] = now();
        if (in_array('updated_at', $cols)) $insert['updated_at'] = now();

        // Si no se detectó ninguna columna para insertar, devolver mensaje claro
        if (empty($insert)) {
            Log::error('EfectivoController: no se detectaron columnas para insertar en movimientos_caja', ['cols' => $cols, 'mapping' => $mapping]);
            return response()->json(['message' => 'No se encontraron columnas coincidentes en movimientos_caja. Revisa la estructura de la tabla.'], 422);
        }

        // Log de depuración: mostrar el mapa de insert antes de ejecutar
        Log::info('EfectivoController: insert payload', $insert);

        try {
            // Insertar sin asumir existencia de columna id
            DB::table('movimientos_caja')->insert($insert);
        } catch (QueryException $ex) {
            Log::error('EfectivoController: error al insertar movimiento', ['exception' => $ex->getMessage(), 'payload' => $insert]);
            return response()->json(['message' => 'Error al insertar movimiento', 'error' => $ex->getMessage()], 500);
        }

        // Recalcular saldo de caja (saldo_inicial como saldo actual)
        $cajaId = (int)($insert['caja_id'] ?? 1);
        CajaSaldoService::recomputeSaldoActual($cajaId);

        // Recuperar el registro insertado por created_at si existe, si no tomar último registro
        if (in_array('created_at', $cols)) {
            $q = DB::table('movimientos_caja')->orderBy('movimientos_caja.created_at', 'desc');
        } else {
            $q = DB::table('movimientos_caja')->orderBy('movimientos_caja.id', 'desc');
        }
        if (in_array('deleted_at', $cols)) $q->whereNull('movimientos_caja.deleted_at');

        // incluir nombre de usuario si existe tabla users (construir COALESCE solo con columnas existentes)
        $userCols = Schema::hasTable('users') ? Schema::getColumnListing('users') : [];
        if (!empty($userCols)) {
            $candidates = [];
            foreach (['name', 'nombre', 'nombre_completo', 'email'] as $uc) {
                if (in_array($uc, $userCols)) $candidates[] = "users.$uc";
            }
            $selectUserExpr = "'' as usuario_nombre";
            if (!empty($candidates)) {
                $selectUserExpr = 'COALESCE(' . implode(', ', $candidates) . ') as usuario_nombre';
            }
            $q->leftJoin('users', 'movimientos_caja.user_id', '=', 'users.id')
              ->select('movimientos_caja.*', DB::raw($selectUserExpr));
        } else {
            $q->select('movimientos_caja.*');
        }

        $mov = $q->first();

        return response()->json(['data' => $mov], 201);
    }

    // Actualizar movimiento existente
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'fecha' => ['nullable', 'date'],
            'detalle' => ['nullable', 'string'],
            'tipo' => ['nullable', 'in:ingreso,egreso'],
            'monto' => ['nullable', 'numeric'],
            'categoria' => ['nullable', 'string'],
            'sucursal' => ['nullable'],
            'usuario' => ['nullable']
        ]);

        $cols = Schema::getColumnListing('movimientos_caja');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) {
                if (in_array($c, $cols)) return $c;
            }
            foreach ($cols as $col) {
                foreach ($candidates as $c) {
                    if (stripos($col, $c) !== false) return $col;
                }
            }
            return null;
        };

        $mapping = [
            'fecha' => $pick(['fecha', 'date', 'fecha_mov']),
            'detalle' => $pick(['detalle', 'descripcion', 'concepto', 'detalle_mov', 'descripcion_mov']),
            'tipo' => $pick(['tipo', 'tipo_movimiento', 'movement_type', 'type']),
            'monto' => $pick(['monto', 'valor', 'importe', 'amount']),
            'categoria' => $pick(['categoria', 'category']),
            'sucursal' => $pick(['sucursal', 'branch', 'sucursal_id']),
            'usuario' => $pick(['usuario', 'user', 'usuario_id'])
        ];

        $update = [];
        foreach ($mapping as $key => $col) {
            if ($col && array_key_exists($key, $data)) {
                $value = $data[$key];
                if ($key === 'monto' && $value !== null) $value = (float)$value;
                $update[$col] = $value;
            }
        }

        if (!empty($mapping['tipo']) && isset($data['tipo'])) {
            $typeColName = $mapping['tipo'];
            $val = strtoupper($data['tipo']);
            if ($val === 'EGRESO') {
                $update[$typeColName] = 'EGRESO';
            } elseif ($val === 'INGRESO') {
                $update[$typeColName] = 'INGRESO';
            } else {
                $update[$typeColName] = $val;
            }
        }

        if (in_array('updated_at', $cols)) $update['updated_at'] = now();

        if (empty($update)) {
            return response()->json(['message' => 'No hay campos para actualizar'], 422);
        }

        try {
            DB::table('movimientos_caja')->where('id', $id)->update($update);
        } catch (QueryException $ex) {
            Log::error('EfectivoController: error al actualizar movimiento', ['exception' => $ex->getMessage(), 'id' => $id, 'payload' => $update]);
            return response()->json(['message' => 'Error al actualizar movimiento', 'error' => $ex->getMessage()], 500);
        }

        // Recalcular saldo de caja (saldo_inicial como saldo actual)
        try {
            $cajaId = (int)(DB::table('movimientos_caja')->where('id', $id)->value('caja_id') ?? 1);
        } catch (\Throwable $e) {
            $cajaId = 1;
        }
        CajaSaldoService::recomputeSaldoActual($cajaId);

        // WORKAROUND: si la columna deleted_at existe y está mal configurada con ON UPDATE, limpiarla inmediatamente
        if (in_array('deleted_at', $cols)) {
            try {
                DB::table('movimientos_caja')->where('id', $id)->update(['deleted_at' => null]);
            } catch (QueryException $ex) {
                Log::warning('EfectivoController: no se pudo limpiar deleted_at tras update', ['exception' => $ex->getMessage(), 'id' => $id]);
            }
        }

        // intentar devolver también nombre de usuario si existe tabla users
        $userCols = Schema::hasTable('users') ? Schema::getColumnListing('users') : [];
        if (!empty($userCols)) {
            $candidates = [];
            foreach (['name', 'nombre', 'nombre_completo', 'email'] as $uc) {
                if (in_array($uc, $userCols)) $candidates[] = "users.$uc";
            }
            $selectUserExpr = "'' as usuario_nombre";
            if (!empty($candidates)) {
                $selectUserExpr = 'COALESCE(' . implode(', ', $candidates) . ') as usuario_nombre';
            }
            $mov = DB::table('movimientos_caja')
                ->leftJoin('users', 'movimientos_caja.user_id', '=', 'users.id')
                ->where('movimientos_caja.id', $id)
                ->select('movimientos_caja.*', DB::raw($selectUserExpr))
                ->first();
        } else {
            $mov = DB::table('movimientos_caja')->where('id', $id)->first();
        }

        return response()->json(['data' => $mov]);
    }

    // Eliminar (soft-delete si existe deleted_at)
    public function destroy($id)
    {
        $cols = Schema::getColumnListing('movimientos_caja');

        // intentar capturar caja_id antes de borrar
        $cajaId = 1;
        try {
            $cajaId = (int)(DB::table('movimientos_caja')->where('id', $id)->value('caja_id') ?? 1);
        } catch (\Throwable $e) {
            $cajaId = 1;
        }

        try {
            if (in_array('deleted_at', $cols)) {
                DB::table('movimientos_caja')->where('id', $id)->update(['deleted_at' => now()]);
            } else {
                DB::table('movimientos_caja')->where('id', $id)->delete();
            }
        } catch (QueryException $ex) {
            Log::error('EfectivoController: error al eliminar movimiento', ['exception' => $ex->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Error al eliminar movimiento', 'error' => $ex->getMessage()], 500);
        }

        // Recalcular saldo de caja (saldo_inicial como saldo actual)
        CajaSaldoService::recomputeSaldoActual($cajaId);

        return response()->json(['message' => 'Eliminado']);
    }
}

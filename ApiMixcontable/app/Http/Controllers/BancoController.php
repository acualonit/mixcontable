<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class BancoController extends Controller
{
    // Listar cuentas bancarias
    public function cuentas()
    {
        if (!Schema::hasTable('cuentas_bancarias')) {
            return response()->json(['data' => []]);
        }
        $cols = Schema::getColumnListing('cuentas_bancarias');
        // helper para escoger nombre de columna flexible
        $pickCol = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };
        $saldoCol = $pickCol(['saldo', 'saldo_inicial', 'saldoInicial', 'initial_balance']);
        // incluir id_sucursal y nombre de sucursal si existe la tabla
        $selectCols = ['cuentas_bancarias.id', 'cuentas_bancarias.banco', 'cuentas_bancarias.numero_cuenta', 'cuentas_bancarias.tipo_cuenta', 'cuentas_bancarias.created_at', 'cuentas_bancarias.id_sucursal'];
        if ($saldoCol) $selectCols[] = 'cuentas_bancarias.'.$saldoCol . ' as saldo';
        $query = DB::table('cuentas_bancarias')->select($selectCols);
        if (Schema::hasTable('sucursales')) {
            $query->leftJoin('sucursales', 'cuentas_bancarias.id_sucursal', '=', 'sucursales.id')
                  ->addSelect('sucursales.nombre as sucursal_nombre');
        }
        // ordenar cuentas: por created_at desc si existe, sino por id desc
        if (in_array('created_at', $cols)) {
            $query->orderBy('cuentas_bancarias.created_at', 'desc');
        } else {
            $query->orderBy('cuentas_bancarias.id', 'desc');
        }
        $cuentas = $query->get();
        return response()->json(['data' => $cuentas]);
    }

    // Recalcula el saldo para una cuenta y lo guarda en `cuentas_bancarias` si existe la columna
    protected function recomputeAndSaveSaldoForAccount($accountId)
    {
        if (!$accountId) return;
        // columnas de movimientos
        if (!Schema::hasTable('movimientos_banco')) return;
        $cols = Schema::getColumnListing('movimientos_banco');
        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };

        $typeCol = $pick(['tipo', 'tipo_movimiento', 'movement_type', 'type']);
        $amountCol = $pick(['monto', 'valor', 'importe', 'amount']);
        $accountCol = $pick(['cuenta_id', 'cuenta', 'cuentaId', 'account_id']);
        $deletedCol = $pick(['deleted_at', 'deletedAt']);

        if (!$typeCol || !$amountCol || !$accountCol) return;

        // patrones según definición de columna de tipo
        $positivePatterns = ['CRED'];
        $negativePatterns = ['DEBIT'];
        try {
            $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$typeCol]);
            if (!empty($colInfo) && isset($colInfo[0]->Type)) {
                $typeDef = strtoupper($colInfo[0]->Type);
                if (strpos($typeDef, 'INGRESO') !== false || strpos($typeDef, 'EGRESO') !== false) {
                    $positivePatterns = ['INGRESO'];
                    $negativePatterns = ['EGRESO'];
                } elseif (strpos($typeDef, 'CREDITO') !== false || strpos($typeDef, 'DEBITO') !== false) {
                    $positivePatterns = ['CRED'];
                    $negativePatterns = ['DEBIT'];
                }
            }
        } catch (\Exception $ex) {
            // ignore
        }

        $whenClauses = [];
        foreach ($positivePatterns as $p) $whenClauses[] = "WHEN `".$typeCol."` LIKE '%".$p."%' THEN `".$amountCol."`";
        foreach ($negativePatterns as $p) $whenClauses[] = "WHEN `".$typeCol."` LIKE '%".$p."%' THEN -`".$amountCol."`";
        $sql = "COALESCE(SUM(CASE " . implode(' ', $whenClauses) . " ELSE 0 END),0) as saldo";

        $query = DB::table('movimientos_banco')->selectRaw($sql)->where($accountCol, $accountId);
        if ($deletedCol) $query->whereNull('movimientos_banco.'.$deletedCol);
        $saldo = (float)$query->value('saldo');

        // actualizar cuentas_bancarias.saldo (detectar nombre de columna flexible)
        if (!Schema::hasTable('cuentas_bancarias')) return;
        $colsCuenta = Schema::getColumnListing('cuentas_bancarias');
        $pickCuenta = function(array $candidates) use ($colsCuenta) {
            foreach ($candidates as $c) if (in_array($c, $colsCuenta)) return $c;
            foreach ($colsCuenta as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };
        $saldoColCuenta = $pickCuenta(['saldo', 'saldo_inicial', 'saldoInicial', 'balance']);
        $idColCuenta = $pickCuenta(['id', 'cuenta_id']);
        if (!$saldoColCuenta) return;
        $update = [$saldoColCuenta => $saldo];
        if (in_array('updated_at', $colsCuenta)) $update['updated_at'] = now();
        $idCol = $idColCuenta ?? 'id';
        try {
            DB::table('cuentas_bancarias')->where($idCol, $accountId)->update($update);
        } catch (\Exception $ex) {
            Log::error('BancoController.recomputeAndSaveSaldoForAccount: error updating cuenta', ['ex' => $ex->getMessage(), 'accountId' => $accountId, 'saldo' => $saldo]);
        }
    }

    // Crear nueva cuenta bancaria
    public function storeCuenta(Request $request)
    {
        if (!Schema::hasTable('cuentas_bancarias')) {
            return response()->json(['message' => 'Tabla cuentas_bancarias no encontrada'], 500);
        }

        $cols = Schema::getColumnListing('cuentas_bancarias');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };

        $mapping = [
            'banco' => $pick(['banco', 'bank', 'nombre_banco']),
            'tipo_cuenta' => $pick(['tipo_cuenta', 'tipo', 'account_type']),
            'numero_cuenta' => $pick(['numero_cuenta', 'numero', 'numeroCuenta', 'account_number']),
            'id_sucursal' => $pick(['id_sucursal', 'idSucursal', 'sucursal_id', 'cuenta_sucursal', 'sucursal']),
            'saldo' => $pick(['saldo', 'saldo_inicial', 'saldoInicial', 'initial_balance']),
            'observaciones' => $pick(['observaciones', 'observacion', 'notes', 'descripcion'])
        ];

        $data = $request->all();
        $insert = [];
        foreach ($mapping as $key => $col) {
            if ($col && isset($data[$key])) {
                $val = $data[$key];
                if ($key === 'saldo' && $val !== null) $val = (float)$val;
                if ($key === 'id_sucursal') $val = intval($val);
                $insert[$col] = $val;
            }
        }

        if (in_array('created_at', $cols)) $insert['created_at'] = now();
        if (in_array('updated_at', $cols)) $insert['updated_at'] = now();

        try {
            $id = DB::table('cuentas_bancarias')->insertGetId($insert);
        } catch (QueryException $ex) {
            Log::error('BancoController: error insert cuenta', ['ex' => $ex->getMessage(), 'payload' => $insert]);
            return response()->json(['message' => 'Error al insertar cuenta', 'error' => $ex->getMessage()], 500);
        }

        $row = DB::table('cuentas_bancarias')->where('id', $id)->first();
        return response()->json(['data' => $row], 201);
    }

    // Saldo por cuenta (suma movimientos) o global
    public function saldo(Request $request)
    {
        $cols = Schema::getColumnListing('movimientos_banco');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };

        $typeCol = $pick(['tipo', 'tipo_movimiento', 'movement_type', 'type']);
        $amountCol = $pick(['monto', 'valor', 'importe', 'amount']);
        $accountCol = $pick(['cuenta_id', 'cuenta', 'cuentaId', 'account_id']);

        if (!$typeCol || !$amountCol) {
            return response()->json(['saldo' => 0]);
        }

        // Detectar si la columna de tipo usa INGRESO/EGRESO o CREDITO/DEBITO
        $positivePatterns = ['CRED'];
        $negativePatterns = ['DEBIT'];
        if ($typeCol) {
            try {
                $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$typeCol]);
                if (!empty($colInfo) && isset($colInfo[0]->Type)) {
                    $typeDef = strtoupper($colInfo[0]->Type);
                    if (strpos($typeDef, 'INGRESO') !== false || strpos($typeDef, 'EGRESO') !== false) {
                        $positivePatterns = ['INGRESO'];
                        $negativePatterns = ['EGRESO'];
                    } elseif (strpos($typeDef, 'CREDITO') !== false || strpos($typeDef, 'DEBITO') !== false) {
                        $positivePatterns = ['CRED'];
                        $negativePatterns = ['DEBIT'];
                    }
                }
            } catch (
            \Exception $ex) {
                // ignore and fallback to defaults
            }
        }

        $whenClauses = [];
        foreach ($positivePatterns as $p) {
            $whenClauses[] = "WHEN `".$typeCol."` LIKE '%".$p."%' THEN `".$amountCol."`";
        }
        foreach ($negativePatterns as $p) {
            $whenClauses[] = "WHEN `".$typeCol."` LIKE '%".$p."%' THEN -`".$amountCol."`";
        }
        $sql = "COALESCE(SUM(CASE " . implode(' ', $whenClauses) . " ELSE 0 END),0) as saldo";

        $query = DB::table('movimientos_banco')->selectRaw($sql);
        if ($accountCol && $request->query('cuenta_id')) {
            $query->where($accountCol, $request->query('cuenta_id'));
        }
        if (in_array('deleted_at', $cols)) $query->whereNull('movimientos_banco.deleted_at');

        $saldo = $query->value('saldo');
        return response()->json(['saldo' => (float)$saldo]);
    }

    // Listar movimientos bancarios (opcionalmente por cuenta)
    public function movimientos(Request $request)
    {
        if (!Schema::hasTable('movimientos_banco')) {
            return response()->json(['data' => []]);
        }
        $cols = Schema::getColumnListing('movimientos_banco');

        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };

        $dateCol = $pick(['fecha', 'date', 'fecha_mov', 'created_at']);
        $accountCol = $pick(['cuenta_id', 'cuenta', 'cuentaId', 'account_id']);

        // Construir consulta base y agregar joins para traer datos de la cuenta y sucursal si existen
        $query = DB::table('movimientos_banco')->select('movimientos_banco.*');
        if ($accountCol) {
            // si la columna de cuenta existe, intentamos join con cuentas_bancarias.id
            if (Schema::hasTable('cuentas_bancarias')) {
                try {
                    $query->leftJoin('cuentas_bancarias', 'movimientos_banco.'.$accountCol, '=', 'cuentas_bancarias.id')
                          ->addSelect('cuentas_bancarias.banco as cuenta_banco', 'cuentas_bancarias.numero_cuenta as cuenta_numero', 'cuentas_bancarias.id_sucursal as cuenta_id_sucursal');
                    if (Schema::hasTable('sucursales')) {
                        $query->leftJoin('sucursales', 'cuentas_bancarias.id_sucursal', '=', 'sucursales.id')
                              ->addSelect('sucursales.nombre as cuenta_sucursal_nombre');
                    }
                } catch (\Exception $ex) {
                    // ignore join failures and continue
                }
            }
            if ($request->query('cuenta_id')) $query->where('movimientos_banco.'.$accountCol, $request->query('cuenta_id'));
        }
        if (in_array('deleted_at', $cols)) $query->whereNull('movimientos_banco.deleted_at');
        if ($dateCol) {
            $query->orderBy('movimientos_banco.'.$dateCol, 'desc')
                  ->orderBy('movimientos_banco.id', 'desc');
        } else {
            // Si no hay columna de fecha, ordenar por id descendente (último creado primero)
            $query->orderBy('movimientos_banco.id', 'desc');
        }

        $mov = $query->get();
        return response()->json(['data' => $mov]);
    }

    // Actualizar movimiento bancario
    public function updateMovimiento(Request $request, $id)
    {
        $data = $request->validate([
            'fecha' => ['required', 'date'],
            'descripcion' => ['nullable', 'string'],
            'tipo' => ['required', 'string'],
            'monto' => ['required', 'numeric'],
            'cuenta_id' => ['required'],
            'referencia' => ['nullable', 'string'],
            'sucursal' => ['nullable', 'string'],
            'categoria' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string']
        ]);

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
            'observaciones' => $pick(['observaciones', 'observacion', 'notes'])
        ];

        $update = [];
        foreach ($mapping as $key => $col) {
            if ($col && array_key_exists($key, $data)) {
                $val = $data[$key];
                if ($key === 'monto' && $val !== null) $val = (float)$val;
                if ($key === 'categoria' && $val !== null) {
                    $v = strtolower(trim($val));
                    if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
                    elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
                    elseif (strpos($v, 'transbank') !== false) $val = 'Transbank';
                    elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
                    else $val = ucfirst($val);
                }
                $update[$col] = $val;
            }
        }

        if (in_array('categoria', $cols) && !array_key_exists('categoria', $update) && array_key_exists('categoria', $data)) {
            $val = $data['categoria'];
            $v = strtolower(trim($val));
            if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
            elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
            elseif (strpos($v, 'transbank') !== false) $val = 'Transbank';
            elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
            else $val = ucfirst($val);
            $update['categoria'] = $val;
        }
        if (in_array('referencia', $cols) && !array_key_exists('referencia', $update) && array_key_exists('referencia', $data)) {
            $update['referencia'] = $data['referencia'];
        }
        if (in_array('observaciones', $cols) && !array_key_exists('observaciones', $update) && array_key_exists('observaciones', $data)) {
            $update['observaciones'] = $data['observaciones'];
        }

        if (!empty($mapping['tipo']) && isset($data['tipo'])) {
            $typeCol = $mapping['tipo'];
            $inputVal = trim($data['tipo']);
            $up = strtoupper($inputVal);
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

            if ($useIngresoEg) {
                if (strtolower($inputVal) === 'ingreso' || $up === 'CREDITO') $update[$typeCol] = 'INGRESO';
                elseif (strtolower($inputVal) === 'egreso' || $up === 'DEBITO') $update[$typeCol] = 'EGRESO';
                else $update[$typeCol] = $up;
            } else {
                if (strtolower($inputVal) === 'ingreso' || $up === 'CREDITO') $update[$typeCol] = 'CREDITO';
                elseif (strtolower($inputVal) === 'egreso' || $up === 'DEBITO') $update[$typeCol] = 'DEBITO';
                else $update[$typeCol] = $up;
            }
        }

        if (in_array('updated_at', $cols)) $update['updated_at'] = now();

        // proteger columnas de auditoría
        if (array_key_exists('deleted_at', $update)) unset($update['deleted_at']);
        if (array_key_exists('id', $update)) unset($update['id']);

        // Si la columna deleted_at tiene definido `ON UPDATE CURRENT_TIMESTAMP`, intentar corregir la definición
        try {
            $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", ['deleted_at']);
            if (!empty($colInfo) && isset($colInfo[0]->Extra) && stripos($colInfo[0]->Extra, 'on update') !== false) {
                Log::warning('BancoController.updateMovimiento: deleted_at tiene ON UPDATE; intentando corregir definición');
                try {
                    DB::statement("ALTER TABLE movimientos_banco MODIFY deleted_at TIMESTAMP NULL DEFAULT NULL");
                    Log::info('BancoController.updateMovimiento: deleted_at modificado para eliminar ON UPDATE');
                } catch (\Exception $ex) {
                    Log::error('BancoController.updateMovimiento: no se pudo modificar deleted_at', ['ex' => $ex->getMessage()]);
                }
            }
        } catch (\Exception $ex) {
            // ignore
        }

        try {
            Log::info('BancoController.updateMovimiento: update_payload', ['id' => $id, 'update' => $update]);
            DB::table('movimientos_banco')->where('id', $id)->update($update);
        } catch (QueryException $ex) {
            Log::error('BancoController: error update movimiento', ['ex' => $ex->getMessage(), 'id' => $id, 'payload' => $update]);
            return response()->json(['message' => 'Error al actualizar movimiento', 'error' => $ex->getMessage()], 500);
        }

        $q = DB::table('movimientos_banco')->where('id', $id);
        if (in_array('deleted_at', $cols)) $q->whereNull('movimientos_banco.deleted_at');
        $mov = $q->first();
        // Recalcular saldo para la cuenta afectada: verificar cuenta original y nueva
        try {
            $accountCol = $mapping['cuenta_id'] ?? null;
            $original = DB::table('movimientos_banco')->where('id', $id)->first();
            $originalAccount = $original && $accountCol && isset($original->{$accountCol}) ? $original->{$accountCol} : null;
            $newAccount = null;
            if ($accountCol && array_key_exists($accountCol, $update)) $newAccount = $update[$accountCol];
            // si cambió cuenta, recomputar para ambas
            if ($originalAccount) $this->recomputeAndSaveSaldoForAccount($originalAccount);
            if ($newAccount && $newAccount != $originalAccount) $this->recomputeAndSaveSaldoForAccount($newAccount);
        } catch (\Exception $ex) {
            Log::error('BancoController.updateMovimiento: error recalculando saldo', ['ex' => $ex->getMessage()]);
        }
        return response()->json(['data' => $mov]);
    }

    // Movimientos eliminados
    public function eliminados()
    {
        if (!Schema::hasTable('movimientos_banco')) return response()->json(['data' => []]);
        $cols = Schema::getColumnListing('movimientos_banco');
        $pick = function(array $candidates) use ($cols) {
            foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
            foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
            return null;
        };
        $dateCol = $pick(['fecha', 'date', 'fecha_mov', 'created_at']);
        $deletedCol = $pick(['deleted_at', 'deletedAt']);

        $query = DB::table('movimientos_banco');
        if ($deletedCol) {
            $query->whereNotNull('movimientos_banco.'.$deletedCol);
        } else {
            return response()->json(['data' => []]);
        }
        if ($dateCol) $query->orderBy('movimientos_banco.'.$dateCol, 'desc')->orderBy('movimientos_banco.id', 'desc');
        $rows = $query->get();
        return response()->json(['data' => $rows]);
    }

    // Crear movimiento bancario
    public function storeMovimiento(Request $request)
    {
        $data = $request->validate([
            'fecha' => ['required', 'date'],
            'descripcion' => ['nullable', 'string'],
            'tipo' => ['required', 'string'],
            'monto' => ['required', 'numeric'],
            'cuenta_id' => ['required'],
            'referencia' => ['nullable', 'string'],
            'sucursal' => ['nullable', 'string'],
            'categoria' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string']
        ]);

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
            'observaciones' => $pick(['observaciones', 'observacion', 'notes'])
        ];

        $insert = [];
        foreach ($mapping as $key => $col) {
            if ($col && array_key_exists($key, $data)) {
                $val = $data[$key];
                if ($key === 'monto' && $val !== null) $val = (float)$val;
                if ($key === 'categoria' && $val !== null) {
                    // Normalizar categorías a los valores del enum en DB
                    $v = strtolower(trim($val));
                    if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
                    elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
                    elseif (strpos($v, 'transbank') !== false) $val = 'Transbank';
                    elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
                    else $val = ucfirst($val);
                }
                $insert[$col] = $val;
            }
        }

        // Fallbacks: si la tabla tiene columnas estándar pero el mapping dinámico no las detectó,
        // forzamos guardarlas con el nombre de columna esperado (solo si vienen en la request)
        if (in_array('categoria', $cols) && !array_key_exists('categoria', $insert) && array_key_exists('categoria', $data)) {
            $val = $data['categoria'];
            $v = strtolower(trim($val));
            if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
            elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
            elseif (strpos($v, 'transbank') !== false) $val = 'Transbank';
            elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
            else $val = ucfirst($val);
            $insert['categoria'] = $val;
        }
        if (in_array('referencia', $cols) && !array_key_exists('referencia', $insert) && array_key_exists('referencia', $data)) {
            $insert['referencia'] = $data['referencia'];
        }
        if (in_array('observaciones', $cols) && !array_key_exists('observaciones', $insert) && array_key_exists('observaciones', $data)) {
            $insert['observaciones'] = $data['observaciones'];
        }

        // Normalizar tipo: detectar enum real y mapear
        if (!empty($mapping['tipo']) && isset($data['tipo'])) {
            $typeCol = $mapping['tipo'];
            $inputVal = trim($data['tipo']);
            $up = strtoupper($inputVal);
            // intentar detectar enum de la columna
            $useIngresoEg = false;
            try {
                $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$typeCol]);
                if (!empty($colInfo) && isset($colInfo[0]->Type)) {
                    $typeDef = strtoupper($colInfo[0]->Type);
                    if (strpos($typeDef, 'INGRESO') !== false || strpos($typeDef, 'EGRESO') !== false) {
                        $useIngresoEg = true;
                    }
                }
            } catch (\Exception $ex) {
                // ignore
            }

            if ($useIngresoEg) {
                if (strtolower($inputVal) === 'ingreso' || $up === 'CREDITO') $insert[$typeCol] = 'INGRESO';
                elseif (strtolower($inputVal) === 'egreso' || $up === 'DEBITO') $insert[$typeCol] = 'EGRESO';
                else $insert[$typeCol] = $up;
            } else {
                if (strtolower($inputVal) === 'ingreso' || $up === 'CREDITO') $insert[$typeCol] = 'CREDITO';
                elseif (strtolower($inputVal) === 'egreso' || $up === 'DEBITO') $insert[$typeCol] = 'DEBITO';
                else $insert[$typeCol] = $up;
            }
        }

        if (in_array('created_at', $cols)) $insert['created_at'] = now();
        if (in_array('updated_at', $cols)) $insert['updated_at'] = now();

        // proteger columnas de auditoría: nunca permitir escribir deleted_at/manualmente
        if (array_key_exists('deleted_at', $insert)) unset($insert['deleted_at']);
        if (array_key_exists('id', $insert)) unset($insert['id']);

        // Si la columna deleted_at tiene definido `ON UPDATE CURRENT_TIMESTAMP`, intentar corregir la definición
        try {
            $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", ['deleted_at']);
            if (!empty($colInfo) && isset($colInfo[0]->Extra) && stripos($colInfo[0]->Extra, 'on update') !== false) {
                Log::warning('BancoController.storeMovimiento: deleted_at tiene ON UPDATE; intentando corregir definición');
                try {
                    DB::statement("ALTER TABLE movimientos_banco MODIFY deleted_at TIMESTAMP NULL DEFAULT NULL");
                    Log::info('BancoController.storeMovimiento: deleted_at modificado para eliminar ON UPDATE');
                } catch (\Exception $ex) {
                    Log::error('BancoController.storeMovimiento: no se pudo modificar deleted_at', ['ex' => $ex->getMessage()]);
                }
            }
        } catch (\Exception $ex) {
            // no hacer nada si falla la inspección
        }

        try {
            Log::info('BancoController.storeMovimiento: cols', ['cols' => $cols]);
            Log::info('BancoController.storeMovimiento: mapping', ['mapping' => $mapping]);
            Log::info('BancoController.storeMovimiento: insert_payload', ['insert' => $insert]);
            DB::table('movimientos_banco')->insert($insert);
        } catch (QueryException $ex) {
            Log::error('BancoController: error insert movimiento', ['ex' => $ex->getMessage(), 'payload' => $insert]);
            return response()->json(['message' => 'Error al insertar movimiento', 'error' => $ex->getMessage()], 500);
        }

        // devolver último movimiento insertado
        $q = DB::table('movimientos_banco')->orderBy('movimientos_banco.id', 'desc');
        if (in_array('deleted_at', $cols)) $q->whereNull('movimientos_banco.deleted_at');
        $mov = $q->first();
        // Recalcular saldo y guardarlo en la cuenta asociada (si aplica)
        try {
            $accountCol = $mapping['cuenta_id'] ?? null;
            $accountId = null;
            if ($accountCol && array_key_exists($accountCol, $insert)) $accountId = $insert[$accountCol];
            elseif ($mov && isset($mov->{$accountCol})) $accountId = $mov->{$accountCol};
            if ($accountId) $this->recomputeAndSaveSaldoForAccount($accountId);
        } catch (\Exception $ex) {
            Log::error('BancoController.storeMovimiento: error recalculando saldo', ['ex' => $ex->getMessage()]);
        }
        return response()->json(['data' => $mov], 201);
    }

    // Eliminar movimiento
    public function destroyMovimiento($id)
    {
        $cols = Schema::getColumnListing('movimientos_banco');
        try {
            if (in_array('deleted_at', $cols)) {
                DB::table('movimientos_banco')->where('id', $id)->update(['deleted_at' => now()]);
            } else {
                // obtener cuenta antes de borrar
                $accountCol = null;
                $pick = function(array $candidates) use ($cols) {
                    foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
                    foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
                    return null;
                };
                $accountCol = $pick(['cuenta_id', 'cuenta', 'cuentaId', 'account_id']);
                $mov = null;
                if ($accountCol) $mov = DB::table('movimientos_banco')->where('id', $id)->first();
                DB::table('movimientos_banco')->where('id', $id)->delete();
                if ($mov && isset($mov->{$accountCol})) $this->recomputeAndSaveSaldoForAccount($mov->{$accountCol});
            }
        } catch (QueryException $ex) {
            Log::error('BancoController: error eliminar movimiento', ['ex' => $ex->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Error al eliminar', 'error' => $ex->getMessage()], 500);
        }
        // Si usamos soft-delete, también recomputar saldo
        try {
            if (in_array('deleted_at', $cols)) {
                $pick = function(array $candidates) use ($cols) {
                    foreach ($candidates as $c) if (in_array($c, $cols)) return $c;
                    foreach ($cols as $col) foreach ($candidates as $c) if (stripos($col, $c) !== false) return $col;
                    return null;
                };
                $accountCol = $pick(['cuenta_id', 'cuenta', 'cuentaId', 'account_id']);
                if ($accountCol) {
                    // obtener el movimiento ahora marcado como deleted
                    $mov2 = DB::table('movimientos_banco')->where('id', $id)->first();
                    if ($mov2 && isset($mov2->{$accountCol})) $this->recomputeAndSaveSaldoForAccount($mov2->{$accountCol});
                }
            }
        } catch (\Exception $ex) {
            Log::error('BancoController.destroyMovimiento: error recalculando saldo', ['ex' => $ex->getMessage()]);
        }
        return response()->json(['message' => 'Eliminado']);
    }
}

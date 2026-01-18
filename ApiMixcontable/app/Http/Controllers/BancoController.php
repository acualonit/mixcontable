<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class BancoController extends Controller
{
    protected function movimientoEsDeVenta($mov): bool
    {
        if (!$mov) return false;

        $obs = '';
        foreach (['observaciones', 'observacion', 'notes', 'nota', 'notas'] as $k) {
            if (isset($mov->{$k}) && $mov->{$k} !== null) { $obs = (string)$mov->{$k}; break; }
        }
        $obsLower = strtolower($obs);
        if (strpos($obsLower, 'origen:venta') !== false || strpos($obsLower, 'origen: venta') !== false) return true;
        if (strpos($obsLower, 'venta_id:') !== false || strpos($obsLower, 'venta id:') !== false) return true;

        // Fallback suave: descripción tipo "Venta ..." (solo si no hay tag)
        $desc = '';
        foreach (['descripcion', 'detalle', 'concepto'] as $k) {
            if (isset($mov->{$k}) && $mov->{$k} !== null) { $desc = (string)$mov->{$k}; break; }
        }
        $descLower = strtolower(trim($desc));
        if (strpos($descLower, 'venta ') === 0) {
            // intentar validar referencia contra ventas para evitar falsos positivos
            $ref = '';
            foreach (['referencia', 'partida', 'reference'] as $k) {
                if (isset($mov->{$k}) && $mov->{$k} !== null) { $ref = (string)$mov->{$k}; break; }
            }
            $refTrim = trim($ref);
            try {
                if (Schema::hasTable('ventas')) {
                    if ($refTrim !== '' && ctype_digit($refTrim)) {
                        if (DB::table('ventas')->where('id', (int)$refTrim)->exists()) return true;
                    }
                    if ($refTrim !== '' && Schema::hasColumn('ventas', 'folioVenta')) {
                        if (DB::table('ventas')->where('folioVenta', $refTrim)->exists()) return true;
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        return false;
    }

    // Listar cuentas bancarias
    public function cuentas()
    {
        if (!Schema::hasTable('cuentas_bancarias')) {
            return response()->json(['data' => []]);
        }

        $cols = Schema::getColumnListing('cuentas_bancarias');

        // construir lista de columnas a seleccionar solo si existen
        $select = [];
        if (in_array('id', $cols)) $select[] = 'cuentas_bancarias.id';
        if (in_array('banco', $cols)) $select[] = 'cuentas_bancarias.banco';
        if (in_array('numero_cuenta', $cols)) $select[] = 'cuentas_bancarias.numero_cuenta';
        if (in_array('tipo_cuenta', $cols)) $select[] = 'cuentas_bancarias.tipo_cuenta';
        if (in_array('saldo_inicial', $cols)) $select[] = 'cuentas_bancarias.saldo_inicial';
        if (in_array('created_at', $cols)) $select[] = 'cuentas_bancarias.created_at';
        if (in_array('id_sucursal', $cols)) $select[] = 'cuentas_bancarias.id_sucursal';

        // si por cualquier razón no encontramos columnas estándar, siempre seleccionar todas para no romper
        if (empty($select)) $select = ['cuentas_bancarias.*'];

        $query = DB::table('cuentas_bancarias')->select($select);

        // intentar unir sucursales solo si la tabla y la columna id_sucursal existen
        if (Schema::hasTable('sucursales') && in_array('id_sucursal', $cols)) {
            $sCols = Schema::getColumnListing('sucursales');
            if (in_array('nombre', $sCols)) {
                $query->leftJoin('sucursales', 'cuentas_bancarias.id_sucursal', '=', 'sucursales.id')
                      ->addSelect('sucursales.nombre as sucursal_nombre');
            } else {
                // join pero sin seleccionar nombre si no existe
                $query->leftJoin('sucursales', 'cuentas_bancarias.id_sucursal', '=', 'sucursales.id');
            }
        }

        try {
            $cuentas = $query->get();
        } catch (\Exception $ex) {
            Log::error('BancoController.cuentas: error al obtener cuentas', ['ex' => $ex->getMessage()]);
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => $cuentas]);
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
            'saldo_inicial' => $pick(['saldo_inicial', 'saldo', 'saldoInicial', 'initial_balance']),
            'observaciones' => $pick(['observaciones', 'observacion', 'notes', 'descripcion'])
        ];

        $data = $request->all();
        $insert = [];
        foreach ($mapping as $key => $col) {
            if ($col && isset($data[$key])) {
                $val = $data[$key];
                if ($key === 'saldo_inicial' && $val !== null) $val = (float)$val;
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
        // Incluir nombre de usuario si existe tabla users (similar a EfectivoController)
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
            try {
                $query->leftJoin('users', 'movimientos_banco.user_id', '=', 'users.id')
                      ->addSelect(DB::raw($selectUserExpr));
            } catch (\Exception $ex) {
                // ignore join failures
            }
        }
        if (in_array('deleted_at', $cols)) $query->whereNull('movimientos_banco.deleted_at');
        if ($dateCol) $query->orderBy('movimientos_banco.'.$dateCol, 'desc');

        $mov = $query->get();
        return response()->json(['data' => $mov]);
    }

    // Actualizar movimiento bancario
    public function updateMovimiento(Request $request, $id)
    {
        // No permitir editar movimientos generados automáticamente desde ventas
        try {
            if (Schema::hasTable('movimientos_banco')) {
                $mov = DB::table('movimientos_banco')->where('id', $id)->first();
                if ($this->movimientoEsDeVenta($mov)) {
                    return response()->json(['message' => 'No se puede editar un movimiento proveniente de ventas'], 403);
                }
            }
        } catch (\Throwable $e) {
            // si falla la detección, continuamos con el flujo normal
        }

        // Log de depuración: id de usuario autenticado (si existe)
        try {
            Log::info('BancoController.updateMovimiento: auth_id', ['auth_id' => \Auth::id(), 'request_user' => optional($request->user())->id]);
        } catch (\Throwable $e) {}
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
            'observaciones' => $pick(['observaciones', 'observacion', 'notes']),
            // columna opcional para guardar usuario que actualiza el movimiento
            'usuario' => $pick(['usuario', 'user', 'usuario_id', 'user_id'])
        ];

        // detectar columna real para user_id en la tabla (si existe)
        $userColDetected = $pick(['user_id', 'usuario', 'usuario_id', 'user', 'userId']);

        $update = [];
        // detectar usuario autenticado para asignar en la actualización
        $authenticatedUserId = null;
        try {
            $u = $request->user();
            if ($u && isset($u->id)) $authenticatedUserId = $u->id;
        } catch (\Throwable $e) {
            $authenticatedUserId = null;
        }
        foreach ($mapping as $key => $col) {
            if ($col && array_key_exists($key, $data)) {
                $val = $data[$key];
                if ($key === 'monto' && $val !== null) $val = (float)$val;
                if ($key === 'usuario') {
                    // preferir usuario autenticado si existe
                    $val = $authenticatedUserId ?? ($data['usuario'] ?? $val);
                }
                if ($key === 'categoria' && $val !== null) {
                    $v = strtolower(trim($val));
                    if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
                    elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
                    elseif (strpos($v, 'pago online') !== false || strpos($v, 'online') !== false) $val = 'Pago Online';
                    elseif (strpos($v, 'tarjeta debito') !== false || strpos($v, 'debito') !== false) $val = 'Tarjeta Debito';
                    elseif (strpos($v, 'tarjeta credito') !== false || strpos($v, 'credito') !== false || strpos($v, 'transbank') !== false) $val = 'Tarjeta Credito';
                    elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
                    else $val = ucfirst($val);

                    // Si la columna categoria es ENUM y no acepta el valor, omitimos para no fallar (usa default DB)
                    try {
                        $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$col]);
                        if (!empty($colInfo) && isset($colInfo[0]->Type) && stripos($colInfo[0]->Type, 'enum') !== false) {
                            preg_match_all("/\\'([^']+)\\'/", $colInfo[0]->Type, $matches);
                            $allowed = $matches[1] ?? [];
                            if (!empty($allowed)) {
                                $found = in_array($val, $allowed, true) || in_array(strtolower($val), array_map('strtolower', $allowed), true);
                                if (!$found) {
                                    continue;
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }
                $update[$col] = $val;
            }
        }

        // En actualizaciones, forzar que la columna de usuario registre quien editó
        try {
            $authId = $authenticatedUserId ?? \Auth::id();
            Log::info('BancoController.updateMovimiento: userColDetected/authId', ['userCol' => $userColDetected, 'authId' => $authId]);
            if ($authId !== null && $userColDetected) {
                $update[$userColDetected] = $authId;
            }
            // forzar user_id si existe en la tabla
            if ($authId !== null && in_array('user_id', $cols)) {
                $update['user_id'] = $authId;
            }
        } catch (\Throwable $e) { /* ignore */ }

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
        if ($dateCol) $query->orderBy('movimientos_banco.'.$dateCol, 'desc');
        $rows = $query->get();
        return response()->json(['data' => $rows]);
    }

    // Crear movimiento bancario
    public function storeMovimiento(Request $request)
    {
        // Log de depuración: id de usuario autenticado (si existe)
        try {
            Log::info('BancoController.storeMovimiento: auth_id', ['auth_id' => \Auth::id()]);
        } catch (\Throwable $e) {}
        // Normalizar aliases comunes desde el frontend para evitar 422 por nombres distintos
        // (p.ej. cuenta en vez de cuenta_id, valor en vez de monto, id_sucursal en vez de sucursal)
        $request->merge([
            'cuenta_id' => $request->input('cuenta_id')
                ?? $request->input('cuentaId')
                ?? $request->input('cuenta')
                ?? $request->input('id_cuenta')
                ?? $request->input('account_id'),
            'monto' => $request->input('monto')
                ?? $request->input('valor')
                ?? $request->input('importe')
                ?? $request->input('amount'),
            // el backend hoy valida `sucursal` como string, pero aceptamos id_sucursal/sucursal_id
            'sucursal' => $request->input('sucursal')
                ?? $request->input('id_sucursal')
                ?? $request->input('sucursal_id'),
        ]);

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
            'observaciones' => $pick(['observaciones', 'observacion', 'notes']),
            // columna opcional para guardar usuario que crea el movimiento
            'usuario' => $pick(['usuario', 'user', 'usuario_id', 'user_id'])
        ];

        // detectar columna real para user_id en la tabla (si existe)
        $userColDetected = $pick(['user_id', 'usuario', 'usuario_id', 'user', 'userId']);

        $insert = [];
        // Determinar user_id autenticado (si hay session/jwt)
        $authenticatedUserId = null;
        try {
            $u = $request->user();
            if ($u && isset($u->id)) $authenticatedUserId = $u->id;
        } catch (\Throwable $e) {
            $authenticatedUserId = null;
        }
        foreach ($mapping as $key => $col) {
            if ($col && array_key_exists($key, $data)) {
                $val = $data[$key];
                if ($key === 'monto' && $val !== null) $val = (float)$val;
                if ($key === 'categoria' && $val !== null) {
                    // Normalizar categorías a los valores del enum en DB
                    $v = strtolower(trim($val));
                    if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
                    elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
                    elseif (strpos($v, 'pago online') !== false || strpos($v, 'online') !== false) $val = 'Pago Online';
                    elseif (strpos($v, 'tarjeta debito') !== false || strpos($v, 'debito') !== false) $val = 'Tarjeta Debito';
                    elseif (strpos($v, 'tarjeta credito') !== false || strpos($v, 'credito') !== false || strpos($v, 'transbank') !== false) $val = 'Tarjeta Credito';
                    elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
                    else $val = ucfirst($val);

                    // Si la columna categoria es ENUM y no acepta el valor, omitimos para no fallar (usa default DB)
                    try {
                        $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", [$col]);
                        if (!empty($colInfo) && isset($colInfo[0]->Type) && stripos($colInfo[0]->Type, 'enum') !== false) {
                            preg_match_all("/\\'([^']+)\\'/", $colInfo[0]->Type, $matches);
                            $allowed = $matches[1] ?? [];
                            if (!empty($allowed)) {
                                $found = in_array($val, $allowed, true) || in_array(strtolower($val), array_map('strtolower', $allowed), true);
                                if (!$found) {
                                    continue;
                                }
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }
                // Si la columna corresponde a usuario, preferir el usuario autenticado
                if ($key === 'usuario') {
                    $val = $authenticatedUserId ?? ($data['usuario'] ?? $val);
                }
                $insert[$col] = $val;
            }
        }

        // Si existe usuario autenticado, asegurar que se guarde su id en la columna detectada
        try {
            $authId = $authenticatedUserId ?? \Auth::id();
            Log::info('BancoController.storeMovimiento: userColDetected/authId', ['userCol' => $userColDetected, 'authId' => $authId]);
            if ($authId !== null && $userColDetected) {
                if (!array_key_exists($userColDetected, $insert)) {
                    $insert[$userColDetected] = $authId;
                }
            }
            // si por algún motivo no detectó la columna pero existe user_id, forzarla
            if ($authId !== null && in_array('user_id', $cols) && !array_key_exists('user_id', $insert)) {
                $insert['user_id'] = $authId;
            }
        } catch (\Throwable $e) { /* ignore */ }

        // Fallbacks: si la tabla tiene columnas estándar pero el mapping dinámico no las detectó,
        // forzamos guardarlas con el nombre de columna esperado (solo si vienen en la request)
        if (in_array('categoria', $cols) && !array_key_exists('categoria', $insert) && array_key_exists('categoria', $data)) {
            $val = $data['categoria'];
            $v = strtolower(trim($val));
            if (in_array($v, ['transferencia','transfer','trans'])) $val = 'Transferencia';
            elseif (in_array($v, ['cheque','check'])) $val = 'Cheque';
            elseif (strpos($v, 'pago online') !== false || strpos($v, 'online') !== false) $val = 'Pago Online';
            elseif (strpos($v, 'tarjeta debito') !== false || strpos($v, 'debito') !== false) $val = 'Tarjeta Debito';
            elseif (strpos($v, 'tarjeta credito') !== false || strpos($v, 'credito') !== false || strpos($v, 'transbank') !== false) $val = 'Tarjeta Credito';
            elseif (strpos($v, 'deposit') !== false) $val = 'Deposito Bancario';
            else $val = ucfirst($val);

            try {
                $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", ['categoria']);
                if (!empty($colInfo) && isset($colInfo[0]->Type) && stripos($colInfo[0]->Type, 'enum') !== false) {
                    preg_match_all("/\\'([^']+)\\'/", $colInfo[0]->Type, $matches);
                    $allowed = $matches[1] ?? [];
                    if (!empty($allowed)) {
                        $found = in_array($val, $allowed, true) || in_array(strtolower($val), array_map('strtolower', $allowed), true);
                        if ($found) {
                            $insert['categoria'] = $val;
                        }
                    } else {
                        $insert['categoria'] = $val;
                    }
                } else {
                    $insert['categoria'] = $val;
                }
            } catch (\Throwable $e) {
                // ignore: si falla, omitimos categoria
            }
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
        return response()->json(['data' => $mov], 201);
    }

    // Eliminar movimiento
    public function destroyMovimiento($id)
    {
        // No permitir eliminar movimientos generados automáticamente desde ventas
        try {
            if (Schema::hasTable('movimientos_banco')) {
                $mov = DB::table('movimientos_banco')->where('id', $id)->first();
                if ($this->movimientoEsDeVenta($mov)) {
                    return response()->json(['message' => 'No se puede eliminar un movimiento proveniente de ventas'], 403);
                }
            }
        } catch (\Throwable $e) {
            // si falla la detección, continuamos
        }

        $cols = Schema::getColumnListing('movimientos_banco');
        try {
            if (in_array('deleted_at', $cols)) {
                DB::table('movimientos_banco')->where('id', $id)->update(['deleted_at' => now()]);
            } else {
                DB::table('movimientos_banco')->where('id', $id)->delete();
            }
        } catch (QueryException $ex) {
            Log::error('BancoController: error eliminar movimiento', ['ex' => $ex->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Error al eliminar', 'error' => $ex->getMessage()], 500);
        }
        return response()->json(['message' => 'Eliminado']);
    }

    // Alias para compatibilidad con la ruta existente
    public function deleteMovimiento($id)
    {
        return $this->destroyMovimiento($id);
    }
}

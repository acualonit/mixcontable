<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CuentasCobrarController extends Controller
{
    /**
     * Resolver nombre de usuario a partir de un id.
     * Intenta primero en 'users' y luego en 'usuarios' (algunos proyectos usan esa tabla).
     */
    protected function resolveUsuarioNombre($uid): ?string
    {
        if (empty($uid)) return null;
        try {
            if (\Schema::hasTable('users')) {
                $uCols = \Schema::getColumnListing('users');
                $select = [];
                foreach (['name','nombre','nombre_completo','username','email'] as $c) if (in_array($c, $uCols)) $select[] = $c;
                if (!empty($select)) {
                    $u = DB::table('users')->where('id', $uid)->select($select)->first();
                    if ($u) {
                        foreach ($select as $c) { if (!empty($u->{$c})) return (string)$u->{$c}; }
                    }
                }
            }
        } catch (\Throwable $__) { /* ignore */ }

        try {
            if (\Schema::hasTable('usuarios')) {
                $uCols = \Schema::getColumnListing('usuarios');
                $select = [];
                foreach (['name','nombre','nombre_completo','username','email'] as $c) if (in_array($c, $uCols)) $select[] = $c;
                if (!empty($select)) {
                    $u = DB::table('usuarios')->where('id', $uid)->select($select)->first();
                    if ($u) {
                        foreach ($select as $c) { if (!empty($u->{$c})) return (string)$u->{$c}; }
                    }
                }
            }
        } catch (\Throwable $__) { /* ignore */ }

        return null;
    }

    /**
     * Resolver nombre de banco. Orden de prioridad:
     * 1) venta_id -> ventas.cuenta_bancaria_id -> cuentas_bancarias
     * 2) cuenta_bancaria_id directa (del pago o de cuentas_cobrar)
     * 2a) banco_id (nuevo): si existe, se intenta resolver en cuentas_bancarias por id
     * 3) sucursal de la venta -> cuentas_bancarias (id_sucursal)
     */
    protected function resolveBancoNombre(?int $ventaId, ?int $cuentaBancariaId, ?int $cuentaCobrarId, ?string &$fuente = null, ?int $bancoId = null): ?string
    {
        $fuente = null;
        try {
            // 1) por venta
            if (!empty($ventaId) && \Schema::hasTable('ventas') && \Schema::hasTable('cuentas_bancarias')) {
                $v = DB::table('ventas')->where('id', $ventaId)->select('cuenta_bancaria_id','sucursal_id')->first();
                if ($v && !empty($v->cuenta_bancaria_id)) {
                    $cb = DB::table('cuentas_bancarias')->where('id', $v->cuenta_bancaria_id)->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                    if ($cb) {
                        foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $c) {
                            if (!empty($cb->{$c})) { $fuente = 'venta:cuenta_bancaria_id'; return (string)$cb->{$c}; }
                        }
                        if (!empty($cb->numero_cuenta)) { $fuente = 'venta:cuenta_bancaria_id:numero_cuenta'; return (string)$cb->numero_cuenta; }
                    }
                }
                $sucursalId = $v->sucursal_id ?? null;
            }

            // 2) por cuenta bancaria directa
            if (!empty($cuentaBancariaId) && \Schema::hasTable('cuentas_bancarias')) {
                $cb = DB::table('cuentas_bancarias')->where('id', $cuentaBancariaId)->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                if ($cb) {
                    foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $c) {
                        if (!empty($cb->{$c})) { $fuente = 'pago/cuenta:cuenta_bancaria_id'; return (string)$cb->{$c}; }
                    }
                    if (!empty($cb->numero_cuenta)) { $fuente = 'pago/cuenta:cuenta_bancaria_id:numero_cuenta'; return (string)$cb->numero_cuenta; }
                }
            }

            // 2a) por banco_id (nuevo) -> se resuelve en cuentas_bancarias por id
            if (empty($cuentaBancariaId) && !empty($bancoId) && \Schema::hasTable('cuentas_bancarias')) {
                $cb = DB::table('cuentas_bancarias')->where('id', $bancoId)->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                if ($cb) {
                    foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $c) {
                        if (!empty($cb->{$c})) { $fuente = 'pago:banco_id'; return (string)$cb->{$c}; }
                    }
                    if (!empty($cb->numero_cuenta)) { $fuente = 'pago:banco_id:numero_cuenta'; return (string)$cb->numero_cuenta; }
                }
            }

            // 2b) si no hay cuenta bancaria directa, intentar desde cuentas_cobrar
            if (empty($cuentaBancariaId) && !empty($cuentaCobrarId) && \Schema::hasTable('cuentas_cobrar') && \Schema::hasTable('cuentas_bancarias')) {
                $cc = DB::table('cuentas_cobrar')->where('id', $cuentaCobrarId)->select('cuenta_bancaria_id','venta_id')->first();
                if ($cc && !empty($cc->cuenta_bancaria_id)) {
                    $cb = DB::table('cuentas_bancarias')->where('id', $cc->cuenta_bancaria_id)->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                    if ($cb) {
                        foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $c) {
                            if (!empty($cb->{$c})) { $fuente = 'cuentas_cobrar:cuenta_bancaria_id'; return (string)$cb->{$c}; }
                        }
                        if (!empty($cb->numero_cuenta)) { $fuente = 'cuentas_cobrar:cuenta_bancaria_id:numero_cuenta'; return (string)$cb->numero_cuenta; }
                    }
                }
                if (empty($ventaId) && $cc && !empty($cc->venta_id)) {
                    return $this->resolveBancoNombre((int)$cc->venta_id, $cuentaBancariaId, $cuentaCobrarId, $fuente, $bancoId);
                }
            }

            // 3) fallback por sucursal
            if (!empty($sucursalId) && \Schema::hasTable('cuentas_bancarias')) {
                $cb = DB::table('cuentas_bancarias')->where('id_sucursal', $sucursalId)->orderBy('id','desc')->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                if ($cb) {
                    foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $c) {
                        if (!empty($cb->{$c})) { $fuente = 'sucursal'; return (string)$cb->{$c}; }
                    }
                    if (!empty($cb->numero_cuenta)) { $fuente = 'sucursal:numero_cuenta'; return (string)$cb->numero_cuenta; }
                }
            }
        } catch (\Throwable $__) {
            // ignore
        }

        return null;
    }

    /**
     * Registrar un pago para una cuenta por cobrar.
     * Acepta 'cuenta_id' o 'venta_id'.
     */
    public function storePago(Request $request)
    {
        $data = $request->all();

        try {
            Log::info('CuentasCobrarController.storePago - request payload', $data);
        } catch (\Exception $e) {
            // ignore logging failures
        }

        $validator = Validator::make($data, [
            'cuenta_id' => 'required_without:venta_id|integer',
            'venta_id' => 'required_without:cuenta_id|integer',
            'fecha_pago' => 'required|date',
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'nullable|string',
            'comprobante' => 'nullable|string',
            'caja_id' => 'nullable|integer',
            // permitir enviar cuenta bancaria explícita
            'cuenta_bancaria_id' => 'nullable|integer',
            // admitir banco_id (nuevo) como alternativa a cuenta_bancaria_id
            'banco_id' => 'nullable|integer',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Resolver o crear la cuenta_cobrar si se envió venta_id en vez de cuenta_id
            $cuentaId = $data['cuenta_id'] ?? null;
            if (!$cuentaId && !empty($data['venta_id'])) {
                // Buscar cuenta existente vinculada a la venta
                $exist = DB::table('cuentas_cobrar')->where('venta_id', $data['venta_id'])->first();
                if ($exist) {
                    $cuentaId = $exist->id;
                } else {
                    // Crear una cuenta_cobrar mínima basada en la venta (si existe tabla ventas)
                    $venta = DB::table('ventas')->where('id', $data['venta_id'])->first();
                    if (!$venta) {
                        return response()->json(['message' => 'Venta no encontrada para asociar pago'], 404);
                    }
                    // Determinar cliente_id: preferir el de la venta, si no existe usar el primer cliente disponible
                    $clienteIdForCuenta = $venta->cliente_id ?? DB::table('clientes')->value('id');
                    if (empty($venta->cliente_id) && $clienteIdForCuenta) {
                        try { Log::warning('CuentasCobrarController.storePago - venta sin cliente_id, usando cliente fallback', ['venta_id' => $venta->id, 'cliente_fallback' => $clienteIdForCuenta]); } catch (\Exception $e) {}
                    }

                    $insertCuenta = [
                        'cliente_id' => $clienteIdForCuenta,
                        'venta_id' => $venta->id,
                        'fecha_emision' => $venta->fecha ?? now(),
                        'fecha_vencimiento' => $venta->fecha_final ?? $venta->fecha ?? now(),
                        'monto_total' => $venta->total ?? 0,
                        'saldo_pendiente' => $venta->total ?? 0,
                        'estado' => 'PENDIENTE',
                        'observaciones' => $venta->observaciones ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    // Si no hay cliente disponible (muy raro), abortar con mensaje claro
                    if (empty($insertCuenta['cliente_id'])) {
                        DB::rollBack();
                        Log::error('CuentasCobrarController.storePago - no hay cliente disponible para crear cuenta_cobrar', ['venta_id' => $venta->id]);
                        return response()->json(['message' => 'No se puede crear cuenta por cobrar: no existe cliente asociado a la venta ni clientes en el sistema'], 500);
                    }

                    $cuentaId = DB::table('cuentas_cobrar')->insertGetId($insertCuenta);
                    try { Log::info('CuentasCobrarController.storePago - created cuenta_cobrar', ['venta_id' => $data['venta_id'], 'cuenta_id' => $cuentaId]); } catch (\Exception $e) {}
                }
            }

            if (!$cuentaId) {
                return response()->json(['message' => 'No se pudo determinar la cuenta a pagar'], 400);
            }

            // Obtener la cuenta actual para validar sobrepago antes de insertar el pago
            $cuenta = DB::table('cuentas_cobrar')->where('id', $cuentaId)->first();
            if (!$cuenta) {
                DB::rollBack();
                return response()->json(['message' => 'Cuenta no encontrada'], 404);
            }

            // Resolver banco_id / cuenta bancaria del pago priorizando el MISMO banco usado al guardar la venta
            $bancoIdResolved = $data['banco_id'] ?? null;
            $bancoIdIsRequired = false;
            $hasBancoIdCol = false;

            try {
                $colInfo = DB::select("SHOW COLUMNS FROM pagos_cuentas_cobrar WHERE Field = ?", ['banco_id']);
                if (!empty($colInfo)) {
                    $hasBancoIdCol = true;
                    $bancoIdIsRequired = (isset($colInfo[0]->Null) && strtoupper((string)$colInfo[0]->Null) === 'NO');
                }
            } catch (\Throwable $__) {
                // ignore
            }

            $ventaIdTmp = $cuenta->venta_id ?? ($data['venta_id'] ?? null);

            // Resolver banco_id para que sea EL MISMO de la venta (misma sucursal)
            // PRIORIDAD:
            // 1) Si la venta generó movimiento bancario (tag VENTA_ID), usamos su cuenta_id (es el banco real usado en la venta)
            // 2) Si no hay movimiento, usamos la cuenta bancaria por sucursal: cuentas_bancarias.id_sucursal = ventas.sucursal_id
            // 3) Si el request trae cuenta_bancaria_id/banco_id, solo se usa si coincide con la sucursal de la venta

            $ventaSucursalId = null;
            if (!empty($ventaIdTmp) && \Schema::hasTable('ventas')) {
                try {
                    $ventaSucursalId = DB::table('ventas')->where('id', $ventaIdTmp)->value('sucursal_id');
                } catch (\Throwable $__) { /* ignore */ }
            }

            // 1) Intentar sacar la misma cuenta bancaria usada al guardar la venta (movimientos_banco tagueado)
            if (empty($bancoIdResolved) && !empty($ventaIdTmp) && \Schema::hasTable('movimientos_banco')) {
                try {
                    $mbCols = \Schema::getColumnListing('movimientos_banco');
                    $obsCol = null;
                    foreach (['observaciones', 'observacion', 'notes', 'notas', 'nota'] as $c) {
                        if (in_array($c, $mbCols)) { $obsCol = $c; break; }
                    }
                    $cuentaCol = null;
                    foreach (['cuenta_id', 'cuenta', 'account_id'] as $c) {
                        if (in_array($c, $mbCols)) { $cuentaCol = $c; break; }
                    }

                    if ($obsCol && $cuentaCol) {
                        $mb = DB::table('movimientos_banco')
                            ->where($obsCol, 'like', '%VENTA_ID:' . $ventaIdTmp . '%')
                            ->orderBy('id', 'desc')
                            ->select($cuentaCol)
                            ->first();
                        if ($mb && !empty($mb->{$cuentaCol})) {
                            $bancoIdResolved = (int)$mb->{$cuentaCol};
                        }
                    }
                } catch (\Throwable $__) {
                    // ignore
                }
            }

            // 2) Si no hay movimiento, escoger cuenta bancaria por sucursal (misma sucursal que la venta)
            if (empty($bancoIdResolved) && !empty($ventaSucursalId) && \Schema::hasTable('cuentas_bancarias')) {
                try {
                    $cb = DB::table('cuentas_bancarias')
                        ->where('id_sucursal', $ventaSucursalId)
                        ->orderBy('id', 'desc')
                        ->select('id')
                        ->first();
                    if ($cb && !empty($cb->id)) {
                        $bancoIdResolved = (int)$cb->id;
                    }
                } catch (\Throwable $__) {
                    // ignore
                }
            }

            // 3) Solo si aún está vacío, aceptar lo que venga del request (pero validando sucursal)
            if (empty($bancoIdResolved)) {
                $candidate = $data['banco_id'] ?? ($data['cuenta_bancaria_id'] ?? null);
                if (!empty($candidate) && \Schema::hasTable('cuentas_bancarias')) {
                    try {
                        if (!empty($ventaSucursalId)) {
                            $ok = DB::table('cuentas_bancarias')->where('id', (int)$candidate)->where('id_sucursal', $ventaSucursalId)->exists();
                            if ($ok) {
                                $bancoIdResolved = (int)$candidate;
                            }
                        } else {
                            // si no hay sucursal en venta, aceptar candidato
                            $bancoIdResolved = (int)$candidate;
                        }
                    } catch (\Throwable $__) {
                        // ignore
                    }
                }
            }

            // Último recurso: primera cuenta bancaria SOLO si no hay venta/sucursal (evitar banco incorrecto)
            if (empty($bancoIdResolved) && empty($ventaIdTmp) && \Schema::hasTable('cuentas_bancarias')) {
                try {
                    $first = DB::table('cuentas_bancarias')->select('id')->orderBy('id', 'asc')->first();
                    if ($first && !empty($first->id)) $bancoIdResolved = (int)$first->id;
                } catch (\Throwable $__) { /* ignore */ }
            }

            // si la columna banco_id existe y es requerida, no permitir null
            if ($hasBancoIdCol && $bancoIdIsRequired && empty($bancoIdResolved)) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Debe seleccionar un banco/cuenta bancaria para registrar este pago',
                    'errors' => ['banco_id' => ['banco_id es requerido (NOT NULL) y no se pudo resolver automáticamente por venta/sucursal']],
                ], 422);
            }

            $saldoActual = (float)($cuenta->saldo_pendiente ?? $cuenta->monto_total ?? 0);

            $monto = (float)$data['monto'];

            // Validar que no se permita sobrepagar (con una pequeña tolerancia numérica)
            if ($monto > $saldoActual + 0.0001) {
                DB::rollBack();
                return response()->json(['message' => 'El monto informado excede el saldo pendiente', 'saldo_pendiente' => $saldoActual], 422);
            }

            $insertPago = [
                'cuenta_cobrar_id' => $cuentaId,
                'fecha_pago' => $data['fecha_pago'],
                'monto_pagado' => $monto,
                'metodo_pago' => $data['metodo_pago'] ?? null,
                'referencia' => $data['comprobante'] ?? null,
                // guardar usuario que registra el pago si la tabla lo soporta
                // (si no existe la columna, se ignora más abajo antes del insert)
                'user_id' => $request->user()?->id ?? null,
                // persistir venta_id para facilitar la resolución de banco por sucursal
                'venta_id' => $cuenta->venta_id ?? ($data['venta_id'] ?? null),
                // persistir cuenta bancaria explícita cuando se envíe
                'cuenta_bancaria_id' => $data['cuenta_bancaria_id'] ?? null,
                // nuevo: usar el banco_id resuelto
                'banco_id' => $hasBancoIdCol ? $bancoIdResolved : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Filtrar columnas existentes en pagos_cuentas_cobrar para evitar errores en esquemas distintos
            try {
                $pcCols = \Schema::getColumnListing('pagos_cuentas_cobrar');
                $insertPago = array_intersect_key($insertPago, array_flip($pcCols));
            } catch (\Throwable $__) { /* ignore */ }

            $pagoId = DB::table('pagos_cuentas_cobrar')->insertGetId($insertPago);
            try { Log::info('CuentasCobrarController.storePago - inserted pago', ['pago_id' => $pagoId, 'insert' => $insertPago]); } catch (\Exception $e) {}

            // Si el pago fue en efectivo, registrar movimiento en caja y actualizar saldo
            $movimientoCreado = null;
            $isEfectivo = !empty($data['metodo_pago']) && (stripos($data['metodo_pago'], 'efectivo') !== false || stripos($data['metodo_pago'], 'efectivo') === 0);
            if ($isEfectivo) {
                // usar caja_id enviado o la primera caja disponible
                $cajaId = $data['caja_id'] ?? DB::table('caja_efectivo')->value('id');
                if ($cajaId) {
                    $mov = [
                        'caja_id' => $cajaId,
                        'user_id' => $request->user()?->id ?? null,
                        // intentar obtener sucursal del usuario si existe
                        'sucursal_id' => $request->user()?->id_sucursal ?? null,
                        'fecha' => $data['fecha_pago'] ?? date('Y-m-d'),
                        'tipo_movimiento' => 'INGRESO',
                        'monto' => $monto,
                        'descripcion' => 'Cobro cuenta por cobrar #' . $cuentaId,
                        'origen' => 'CXC',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $movId = DB::table('movimientos_caja')->insertGetId($mov);
                    $movimientoCreado = DB::table('movimientos_caja')->where('id', $movId)->first();

                    // Actualizar saldo de la caja (incrementa saldo_actual)
                    DB::table('caja_efectivo')->where('id', $cajaId)->increment('saldo_actual', $monto);
                }
            }

            // Actualizar saldo en cuenta
            $cuenta = DB::table('cuentas_cobrar')->where('id', $cuentaId)->first();
            $saldoActual = (float)($cuenta->saldo_pendiente ?? $cuenta->monto_total ?? 0);
            $nuevoSaldo = max(0, $saldoActual - $monto);
            $nuevoEstado = $nuevoSaldo <= 0 ? 'PAGADA' : ($cuenta->estado ?? 'PENDIENTE');

            // Preparar campos a actualizar en la cuenta: saldo, estado y opcionalmente observaciones
            $updateFields = [
                'saldo_pendiente' => $nuevoSaldo,
                'estado' => $nuevoEstado,
                'updated_at' => now()
            ];

            if (!empty($data['observaciones'])) {
                // concatenar observaciones existentes con la nueva (separadas por salto de línea)
                $existingObs = $cuenta->observaciones ?? '';
                $newObs = trim($data['observaciones']);
                $combined = $existingObs ? ($existingObs . "\n" . $newObs) : $newObs;
                $updateFields['observaciones'] = $combined;
            }

            DB::table('cuentas_cobrar')->where('id', $cuentaId)->update($updateFields);

            // Registrar movimiento bancario si el método de pago es bancario
            try {
                if (\Schema::hasTable('movimientos_banco') && !empty($data['metodo_pago'])) {
                    $mp = strtolower(trim($data['metodo_pago']));
                    // Solo estos métodos deben impactar banco (aceptamos 'transbank' como alias histórico)
                    $metodosBanco = ['transferencia','tarjeta debito','tarjeta credito','pago online','debito','credito','online','transferencia bancaria','transbank'];
                    $isBanco = false;
                    foreach ($metodosBanco as $m) { if (strpos($mp, $m) !== false) { $isBanco = true; break; } }

                    if ($isBanco) {
                        // USAR LA MISMA CUENTA/BANCO QUE SE GUARDÓ EN EL PAGO (CXC)
                        // prioridad: banco_id resuelto -> cuenta_bancaria_id del request -> cuenta_bancaria_id de la cuenta_cobrar
                        $cuentaBancoId = null;
                        if (!empty($bancoIdResolved)) {
                            $cuentaBancoId = (int)$bancoIdResolved;
                        } elseif (!empty($data['cuenta_bancaria_id'])) {
                            $cuentaBancoId = (int)$data['cuenta_bancaria_id'];
                        } elseif (!empty($cuenta->cuenta_bancaria_id)) {
                            $cuentaBancoId = (int)$cuenta->cuenta_bancaria_id;
                        }

                        // compatibilidad antigua: evitar interpretar cuenta_id/cuentaId (son ids de CxC, no de banco)

                        if (!$cuentaBancoId && \Schema::hasTable('cuentas_bancarias')) {
                            // último recurso: si realmente no hay nada, tomar la primera cuenta bancaria
                            $cuentaBancoId = (int) (DB::table('cuentas_bancarias')->value('id') ?? 0);
                        }

                        if (!empty($cuentaBancoId)) {
                            $cols = \Schema::getColumnListing('movimientos_banco');
                            $insert = [];

                            $categoriaCandidate = null;
                            if (strpos($mp, 'pago online') !== false || strpos($mp, 'online') !== false) {
                                $categoriaCandidate = 'Pago Online';
                            } elseif (strpos($mp, 'tarjeta debito') !== false || strpos($mp, 'debito') !== false) {
                                $categoriaCandidate = 'Tarjeta Debito';
                            } elseif (strpos($mp, 'tarjeta credito') !== false || strpos($mp, 'credito') !== false || strpos($mp, 'transbank') !== false) {
                                $categoriaCandidate = 'Tarjeta Credito';
                            } elseif (strpos($mp, 'transferencia') !== false) {
                                $categoriaCandidate = 'Transferencia';
                            }

                            // agregar tag en observaciones para poder rastrear la venta/cuenta
                            $obsTag = 'CXC_ID:' . $cuentaId;
                            if (!empty($ventaIdTmp)) $obsTag .= ' VENTA_ID:' . $ventaIdTmp;
                            $obsFinal = trim((string)($data['observaciones'] ?? ''));
                            $obsFinal = $obsFinal ? ($obsFinal . ' | ' . $obsTag) : $obsTag;

                            // Construir el base sin asegurar 'categoria' aún
                            $base = [
                                'cuenta_id' => $cuentaBancoId,
                                'user_id' => $request->user()?->id ?? null,
                                'fecha' => $data['fecha_pago'] ?? date('Y-m-d'),
                                'monto' => (float) $monto,
                                'descripcion' => 'Cobro cuenta por cobrar #' . $cuentaId,
                                'tipo_movimiento' => 'INGRESO',
                                'referencia' => $data['comprobante'] ?? null,
                                'observaciones' => $obsFinal,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];

                            // Verificar si la columna categoria acepta el valor calculado; si no, omitimos para usar el default DB
                            try {
                                $colInfo = DB::select("SHOW COLUMNS FROM movimientos_banco WHERE Field = ?", ['categoria']);
                                if (!empty($colInfo) && isset($colInfo[0]->Type) && stripos($colInfo[0]->Type, 'enum') !== false) {
                                    preg_match_all("/\\'([^']+)\\'/", $colInfo[0]->Type, $matches);
                                    $allowed = $matches[1] ?? [];
                                    if (!empty($allowed) && !empty($categoriaCandidate)) {
                                        // match exact (case-sensitive) or case-insensitive
                                        $found = in_array($categoriaCandidate, $allowed, true) || in_array(strtolower($categoriaCandidate), array_map('strtolower', $allowed), true);
                                        if ($found) {
                                            $base['categoria'] = $categoriaCandidate;
                                        }
                                    }
                                }
                            } catch (\Exception $e) {
                                // si falla obtención de metadatos, omitir categoría para evitar errores
                            }

                            foreach ($base as $k => $v) {
                                // mapear solo columnas existentes en la tabla
                                if (in_array($k, $cols)) $insert[$k] = $v;
                            }

                            if (!empty($insert)) {
                                try {
                                    Log::info('CuentasCobrarController: movimiento_banco payload', ['insert' => $insert, 'cuentaBancoId' => $cuentaBancoId, 'metodo_pago' => $data['metodo_pago'] ?? null]);
                                } catch (\Exception $ex) {
                                    // no detener flujo por fallo en logging
                                }
                                DB::table('movimientos_banco')->insert($insert);
                            }
                        } else {
                            Log::warning('No se encontró cuenta bancaria para registrar movimiento_banco desde pago CxC', ['venta_id' => $data['venta_id'] ?? null, 'cuenta_id' => $cuentaId]);
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Error registrando movimiento_banco desde CuentasCobrarController', ['error' => $e->getMessage(), 'payload' => $data]);
            }

            DB::commit();

            $pago = DB::table('pagos_cuentas_cobrar')->where('id', $pagoId)->first();
            $cuentaActualizada = DB::table('cuentas_cobrar')->where('id', $cuentaId)->first();

            // Attempt to resolve bank name for immediate response
            $bancoNombre = null;
            $bancoFuente = null;
            $bancoId = $data['banco_id'] ?? null;
            try {
                $possibleBankId = $data['cuenta_bancaria_id'] ?? ($data['cuenta_id_banco'] ?? ($data['cuentaId'] ?? null));
                if (empty($possibleBankId) && !empty($cuentaActualizada->cuenta_bancaria_id)) {
                    $possibleBankId = $cuentaActualizada->cuenta_bancaria_id;
                }
                if (empty($possibleBankId) && !empty($data['venta_id'])) {
                    $vbank = DB::table('ventas')->where('id', $data['venta_id'])->select('cuenta_bancaria_id')->first();
                    if (!empty($vbank->cuenta_bancaria_id)) $possibleBankId = $vbank->cuenta_bancaria_id;
                }

                // usar el resolver "mejor" que incluye banco_id
                $ventaIdForResolve = !empty($cuentaActualizada->venta_id) ? (int)$cuentaActualizada->venta_id : (!empty($data['venta_id']) ? (int)$data['venta_id'] : null);
                $cuentaBancariaIdForResolve = !empty($possibleBankId) ? (int)$possibleBankId : null;
                $bancoNombre = $this->resolveBancoNombre($ventaIdForResolve, $cuentaBancariaIdForResolve, !empty($cuentaActualizada->id) ? (int)$cuentaActualizada->id : null, $bancoFuente, $bancoId ? (int)$bancoId : null);

                // fallback visible
                if (empty($bancoNombre) && !empty($cuentaBancariaIdForResolve)) {
                    $bancoNombre = 'Cuenta #' . $cuentaBancariaIdForResolve;
                    $bancoFuente = $bancoFuente ?? 'fallback:cuenta_bancaria_id';
                } elseif (empty($bancoNombre) && !empty($bancoId)) {
                    $bancoNombre = 'Cuenta #' . $bancoId;
                    $bancoFuente = $bancoFuente ?? 'fallback:banco_id';
                }
            } catch (\Throwable $__) { /* ignore */ }

            // Normalizar la estructura de 'pago' para mantener compatibilidad con frontend
            $pagoResp = [
                'id' => $pago->id,
                'cuenta_cobrar_id' => $pago->cuenta_cobrar_id,
                'fecha_pago' => $pago->fecha_pago,
                // devolver también 'monto' que el frontend espera, mapeado desde 'monto_pagado'
                'monto' => $pago->monto_pagado,
                'monto_pagado' => $pago->monto_pagado,
                'metodo_pago' => $pago->metodo_pago,
                // devolver 'comprobante' por compatibilidad mapeado desde 'referencia'
                'comprobante' => $pago->referencia,
                'referencia' => $pago->referencia,
                // incluir observaciones enviadas en el pago (si las hubo)
                'observaciones' => $data['observaciones'] ?? null,
                // incluir movimiento de caja creado (si aplica)
                'movimiento_caja' => $movimientoCreado ? (array)$movimientoCreado : null,
                'created_at' => $pago->created_at,
                'updated_at' => $pago->updated_at,
                // incluir nombre del banco cuando esté disponible
                'banco_id' => $pago->banco_id ?? ($data['banco_id'] ?? null),
                'cuenta_bancaria_id' => $pago->cuenta_bancaria_id ?? ($data['cuenta_bancaria_id'] ?? null),
                'banco_nombre' => $bancoNombre,
                'banco_fuente' => $bancoFuente ?? null,
            ];

            return response()->json(['pago' => $pagoResp, 'cuenta' => $cuentaActualizada], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registrando pago cxc', ['error' => $e->getMessage(), 'payload' => $data]);
            return response()->json(['message' => 'Error al registrar pago', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener pagos asociados a una cuenta por cobrar
     * GET /cuentas-cobrar/{cuenta}/pagos
     */
    public function pagosPorCuenta($cuentaId)
    {
        try {
            if (!\Schema::hasTable('pagos_cuentas_cobrar')) {
                return response()->json(['pagos' => [], 'monto_total' => 0]);
            }

            $pcCols = \Schema::getColumnListing('pagos_cuentas_cobrar');

            $select = ['id'];
            foreach (['fecha', 'created_at', 'fecha_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['metodo', 'metodo_pago', 'tipo', 'forma_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['comprobante', 'referencia', 'nota'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['user_id', 'usuario_id', 'created_by'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            // nuevo: traer banco_id / cuenta_bancaria_id cuando existan
            foreach (['banco_id','cuenta_bancaria_id','cuenta_id_banco'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['venta_id'] as $c) if (in_array($c, $pcCols)) $select[] = $c;

            $select = array_unique($select);

            $raw = DB::table('pagos_cuentas_cobrar')
                ->where('cuenta_cobrar_id', $cuentaId)
                ->select($select)
                ->orderBy('id', 'asc')
                ->get();

            $pagos = [];
            $montoTotal = 0.0;
            foreach ($raw as $r) {
                $row = (array) $r;
                $m = 0.0;
                foreach (['monto_pagado','monto','valor','importe'] as $c) {
                    if (array_key_exists($c, $row) && $row[$c] !== null) { $m = (float)$row[$c]; break; }
                }
                $montoTotal += $m;

                // resolver usuario en users/usuarios
                $uid = $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null));
                $usuarioNombre = $this->resolveUsuarioNombre($uid);

                // intentar resolver número/identificador legible de la cuenta si existe cuenta_cobrar_id
                $cuentaNumero = null;
                $bancoNombre = null;
                $bancoFuente = null;
                try {
                    if (!empty($row['cuenta_cobrar_id']) && \Schema::hasTable('cuentas_cobrar')) {
                        $cc = DB::table('cuentas_cobrar')->where('id', $row['cuenta_cobrar_id'])->select('numero','numero_documento','nro_documento','documento','folio','referencia','monto_total','cuenta_bancaria_id','venta_id')->first();
                        if ($cc) {
                            $ventaId = $row['venta_id'] ?? ($cc->venta_id ?? null);
                            $cuentaBancariaId = $row['cuenta_bancaria_id'] ?? ($cc->cuenta_bancaria_id ?? null);
                            $bancoId = $row['banco_id'] ?? null;
                            $bancoNombre = $this->resolveBancoNombre($ventaId ? (int)$ventaId : null, $cuentaBancariaId ? (int)$cuentaBancariaId : null, (int)$row['cuenta_cobrar_id'], $bancoFuente, $bancoId ? (int)$bancoId : null);

                            if (empty($bancoNombre) && !empty($cuentaBancariaId)) {
                                $bancoNombre = 'Cuenta #' . $cuentaBancariaId;
                                $bancoFuente = $bancoFuente ?? 'fallback:cuenta_bancaria_id';
                            } elseif (empty($bancoNombre) && !empty($bancoId)) {
                                $bancoNombre = 'Cuenta #' . $bancoId;
                                $bancoFuente = $bancoFuente ?? 'fallback:banco_id';
                            }

                            foreach (['numero','numero_documento','nro_documento','documento','folio','referencia'] as $c) {
                                if (!empty($cc->{$c})) { $cuentaNumero = (string)$cc->{$c}; break; }
                            }
                        }
                    }
                } catch (\Throwable $__) { /* ignore */ }

                // preparar valor visible para la columna de cuenta/banco
                $displayCuenta = $bancoNombre ?? $cuentaNumero ?? null;
                $displayFuente = $bancoFuente ?? null;
                if (empty($displayCuenta) && !empty($row['cuenta_cobrar_id'])) {
                    $displayCuenta = 'Cuenta #' . $row['cuenta_cobrar_id'];
                    $displayFuente = $displayFuente ?? 'fallback:cuenta';
                }

                $pagos[] = [
                    'id' => $row['id'] ?? null,
                    'fecha_pago' => $row['fecha_pago'] ?? ($row['fecha'] ?? ($row['created_at'] ?? null)),
                    'monto' => $m,
                    'monto_pagado' => $m,
                    'metodo_pago' => $row['metodo_pago'] ?? ($row['metodo'] ?? ($row['tipo'] ?? null)),
                    'comprobante' => $row['referencia'] ?? ($row['comprobante'] ?? ($row['nota'] ?? null)),
                    'usuario_id' => $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null)),
                    'usuario' => $usuarioNombre,
                    'cuenta_numero' => $displayCuenta,
                    'banco_nombre' => $bancoNombre,
                    'banco_fuente' => $displayFuente ?? null,
                    'raw' => $row,
                ];
            }

            return response()->json(['pagos' => $pagos, 'monto_total' => $montoTotal]);
        } catch (\Throwable $e) {
            try { Log::error('CuentasCobrarController@pagosPorCuenta error', ['error' => $e->getMessage(), 'cuenta' => $cuentaId]); } catch (\Throwable $__ ) {}
            return response()->json(['pagos' => [], 'monto_total' => 0]);
        }
    }

    /**
     * Obtener pagos asociados a una venta (por venta_id o mediante cuentas_cobrar vinculadas)
     * GET /ventas/{venta}/pagos
     */
    public function pagosPorVenta($ventaId)
    {
        try {
            if (!\Schema::hasTable('pagos_cuentas_cobrar')) {
                return response()->json(['pagos' => [], 'monto_total' => 0]);
            }

            $pcCols = \Schema::getColumnListing('pagos_cuentas_cobrar');
            $pagos = [];
            $montoTotal = 0.0;

            // Si existe columna venta_id en pagos, usarla
            if (in_array('venta_id', $pcCols)) {
                $raw = DB::table('pagos_cuentas_cobrar')
                    ->where('venta_id', $ventaId)
                    ->select(array_unique(array_merge(['id'], $pcCols)))
                    ->orderBy('id', 'asc')
                    ->get();

                foreach ($raw as $r) {
                    $row = (array) $r;
                    $m = 0.0;
                    foreach (['monto_pagado','monto','valor','importe'] as $c) {
                        if (array_key_exists($c, $row) && $row[$c] !== null) { $m = (float)$row[$c]; break; }
                    }
                    $montoTotal += $m;

                    // resolver usuario en users/usuarios
                    $uid = $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null));
                    $usuarioNombre = $this->resolveUsuarioNombre($uid);

                    // intentar resolver número/identificador legible de la cuenta si existe cuenta_cobrar_id
                    $cuentaNumero = null;
                    $bancoNombre = null;
                    $bancoFuente = null;
                    try {
                        if (!empty($row['cuenta_cobrar_id']) && \Schema::hasTable('cuentas_cobrar')) {
                            $cc = DB::table('cuentas_cobrar')->where('id', $row['cuenta_cobrar_id'])->select('numero','numero_documento','nro_documento','documento','folio','referencia','monto_total','cuenta_bancaria_id','venta_id')->first();
                            if ($cc) {
                                // resolver banco por venta_id/cuenta_bancaria (mejor solución)
                                $ventaId = $cc->venta_id ?? ($row['venta_id'] ?? null);
                                $cuentaBancariaId = $row['cuenta_bancaria_id'] ?? ($cc->cuenta_bancaria_id ?? null);
                                $bancoId = $row['banco_id'] ?? null;
                                $bancoNombre = $this->resolveBancoNombre($ventaId ? (int)$ventaId : null, $cuentaBancariaId ? (int)$cuentaBancariaId : null, (int)$row['cuenta_cobrar_id'], $bancoFuente, $bancoId ? (int)$bancoId : null);

                                if (empty($bancoNombre) && !empty($cuentaBancariaId)) {
                                    $bancoNombre = 'Cuenta #' . $cuentaBancariaId;
                                    $bancoFuente = $bancoFuente ?? 'fallback:cuenta_bancaria_id';
                                } elseif (empty($bancoNombre) && !empty($bancoId)) {
                                    $bancoNombre = 'Cuenta #' . $bancoId;
                                    $bancoFuente = $bancoFuente ?? 'fallback:banco_id';
                                }

                                // Si no se obtuvo nombre del banco, seguir buscando campos legibles en cuentas_cobrar
                                if (empty($bancoNombre)) {
                                    foreach (['numero','numero_documento','nro_documento','documento','folio','referencia'] as $f) {
                                        if (!empty($cc->{$f})) { $cuentaNumero = $cc->{$f}; $bancoFuente = 'cuentas_cobrar'; break; }
                                    }
                                    // si no hay valor legible en cuentas_cobrar, intentar obtener número desde la venta vinculada
                                    if (empty($cuentaNumero) && !empty($cc->venta_id)) {
                                        try {
                                            $v = DB::table('ventas')->where('id', $cc->venta_id)->select('numero','folio','folio_completo','codigo','serie','documento','numero_documento','numero_venta')->first();
                                            if ($v) {
                                                foreach (['folio_completo','numero','folio','codigo','serie','numero_documento','documento','numero_venta'] as $vf) {
                                                    if (!empty($v->{$vf})) { $cuentaNumero = $v->{$vf}; $bancoFuente = 'venta'; break; }
                                                }
                                            }
                                        } catch (\Throwable $__) { /* ignore */ }
                                    }
                                }

                                // fallback: si aún no hay campos anteriores, usar solo el id (sin prefijo)
                                if (empty($bancoNombre) && empty($cuentaNumero)) { $cuentaNumero = (string)$row['cuenta_cobrar_id']; $bancoFuente = 'fallback:id'; }
                            }
                        }
                    } catch (\Throwable $__) { $cuentaNumero = null; }

                    // preparar valor visible para la columna de cuenta/banco
                    $displayCuenta = $bancoNombre ?? $cuentaNumero ?? null;
                    $displayFuente = $bancoFuente ?? null;
                    if (empty($displayCuenta) && !empty($row['cuenta_cobrar_id'])) {
                        $displayCuenta = 'Cuenta #' . $row['cuenta_cobrar_id'];
                        $displayFuente = $displayFuente ?? 'fallback:cuenta';
                    }

                    $pagos[] = [
                        'id' => $row['id'] ?? null,
                        'fecha_pago' => $row['fecha_pago'] ?? ($row['fecha'] ?? ($row['created_at'] ?? null)),
                        'monto' => $m,
                        'monto_pagado' => $m,
                        'metodo_pago' => $row['metodo_pago'] ?? ($row['metodo'] ?? ($row['tipo'] ?? null)),
                        'comprobante' => $row['referencia'] ?? ($row['comprobante'] ?? ($row['nota'] ?? null)),
                        'usuario_id' => $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null)),
                        'usuario' => $usuarioNombre,
                        'cuenta_numero' => $displayCuenta,
                        'banco_nombre' => $bancoNombre,
                        'banco_fuente' => $displayFuente ?? null,
                        'raw' => $row,
                    ];
                }
            } else {
                // Buscar cuentas_cobrar vinculadas a la venta y obtener sus pagos
                if (\Schema::hasTable('cuentas_cobrar') && \Schema::hasColumn('cuentas_cobrar', 'venta_id')) {
                    $cuentas = DB::table('cuentas_cobrar')->where('venta_id', $ventaId)->pluck('id')->toArray();
                    if (!empty($cuentas)) {
                        $select = ['id'];
                        foreach (['fecha', 'created_at', 'fecha_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
                        foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
                        foreach (['metodo', 'metodo_pago', 'tipo', 'forma_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
                        foreach (['comprobante', 'referencia', 'nota'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
                        foreach (['user_id', 'usuario_id', 'created_by'] as $c) if (in_array($c, $pcCols)) $select[] = $c;

                        $select = array_unique($select);

                        $raw = DB::table('pagos_cuentas_cobrar')
                            ->whereIn('cuenta_cobrar_id', $cuentas)
                            ->select($select)
                            ->orderBy('id', 'asc')
                            ->get();

                        foreach ($raw as $r) {
                            $row = (array) $r;
                            $m = 0.0;
                            foreach (['monto_pagado','monto','valor','importe'] as $c) {
                                if (array_key_exists($c, $row) && $row[$c] !== null) { $m = (float)$row[$c]; break; }
                            }
                            $montoTotal += $m;

                            // resolver usuario en users/usuarios
                            $uid = $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null));
                            $usuarioNombre = $this->resolveUsuarioNombre($uid);

                            // intentar resolver número/identificador legible de la cuenta si existe cuenta_cobrar_id
                            $cuentaNumero = null;
                            $bancoNombre = null;
                            $bancoFuente = null;
                            try {
                                if (!empty($row['cuenta_cobrar_id']) && \Schema::hasTable('cuentas_cobrar')) {
                                    $cc = DB::table('cuentas_cobrar')->where('id', $row['cuenta_cobrar_id'])->select('numero','numero_documento','nro_documento','documento','folio','referencia','monto_total','cuenta_bancaria_id','venta_id')->first();
                                    if ($cc) {
                                        // resolver banco por venta_id/cuenta_bancaria (mejor solución)
                                        $ventaId = $cc->venta_id ?? ($row['venta_id'] ?? null);
                                        $cuentaBancariaId = $row['cuenta_bancaria_id'] ?? ($cc->cuenta_bancaria_id ?? null);
                                        $bancoId = $row['banco_id'] ?? null;
                                        $bancoNombre = $this->resolveBancoNombre($ventaId ? (int)$ventaId : null, $cuentaBancariaId ? (int)$cuentaBancariaId : null, (int)$row['cuenta_cobrar_id'], $bancoFuente, $bancoId ? (int)$bancoId : null);

                                        if (empty($bancoNombre) && !empty($cuentaBancariaId)) {
                                            $bancoNombre = 'Cuenta #' . $cuentaBancariaId;
                                            $bancoFuente = $bancoFuente ?? 'fallback:cuenta_bancaria_id';
                                        } elseif (empty($bancoNombre) && !empty($bancoId)) {
                                            $bancoNombre = 'Cuenta #' . $bancoId;
                                            $bancoFuente = $bancoFuente ?? 'fallback:banco_id';
                                        }

                                        // Si no se obtuvo nombre del banco, seguir buscando campos legibles en cuentas_cobrar
                                        if (empty($bancoNombre)) {
                                            foreach (['numero','numero_documento','nro_documento','documento','folio','referencia'] as $f) {
                                                if (!empty($cc->{$f})) { $cuentaNumero = $cc->{$f}; $bancoFuente = 'cuentas_cobrar'; break; }
                                            }
                                            // si no hay valor legible en cuentas_cobrar, intentar obtener número desde la venta vinculada
                                            if (empty($cuentaNumero) && !empty($cc->venta_id)) {
                                                try {
                                                    $v = DB::table('ventas')->where('id', $cc->venta_id)->select('numero','folio','folio_completo','codigo','serie','documento','numero_documento','numero_venta')->first();
                                                    if ($v) {
                                                        foreach (['folio_completo','numero','folio','codigo','serie','numero_documento','documento','numero_venta'] as $vf) {
                                                            if (!empty($v->{$vf})) { $cuentaNumero = $v->{$vf}; $bancoFuente = 'venta'; break; }
                                                        }
                                                    }
                                                } catch (\Throwable $__) { /* ignore */ }
                                            }
                                        }

                                        // fallback: si aún no hay campos anteriores, usar solo el id (sin prefijo)
                                        if (empty($bancoNombre) && empty($cuentaNumero)) { $cuentaNumero = (string)$row['cuenta_cobrar_id']; $bancoFuente = 'fallback:id'; }
                                    }
                                }
                            } catch (\Throwable $__) { $cuentaNumero = null; }

                            // preparar valor visible para la columna de cuenta/banco
                            $displayCuenta = $bancoNombre ?? $cuentaNumero ?? null;
                            $displayFuente = $bancoFuente ?? null;
                            if (empty($displayCuenta) && !empty($row['cuenta_cobrar_id'])) {
                                $displayCuenta = 'Cuenta #' . $row['cuenta_cobrar_id'];
                                $displayFuente = $displayFuente ?? 'fallback:cuenta';
                            }

                            $pagos[] = [
                                'id' => $row['id'] ?? null,
                                'fecha_pago' => $row['fecha_pago'] ?? ($row['fecha'] ?? ($row['created_at'] ?? null)),
                                'monto' => $m,
                                'monto_pagado' => $m,
                                'metodo_pago' => $row['metodo_pago'] ?? ($row['metodo'] ?? ($row['tipo'] ?? null)),
                                'comprobante' => $row['referencia'] ?? ($row['comprobante'] ?? ($row['nota'] ?? null)),
                                'usuario_id' => $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null)),
                                'usuario' => $usuarioNombre,
                                'cuenta_numero' => $displayCuenta,
                                'banco_nombre' => $bancoNombre,
                                'banco_fuente' => $displayFuente ?? null,
                                'raw' => $row,
                            ];
                        }
                    }
                }
            }

            return response()->json(['pagos' => $pagos, 'monto_total' => $montoTotal]);
        } catch (\Throwable $e) {
            try { Log::error('CuentasCobrarController@pagosPorVenta error', ['error' => $e->getMessage(), 'venta' => $ventaId]); } catch (\Throwable $__ ) {}
            return response()->json(['pagos' => [], 'monto_total' => 0]);
        }
    }

    /**
     * Listado histórico de pagos (global) opcionalmente filtrado por mes (YYYY-MM)
     * GET /cuentas-cobrar/pagos
     */
    public function pagosHistorico(Request $request)
    {
        try {
            if (!\Schema::hasTable('pagos_cuentas_cobrar')) {
                return response()->json(['pagos' => [], 'monto_total' => 0]);
            }

            $mes = $request->query('mes'); // formato YYYY-MM

            $pcCols = \Schema::getColumnListing('pagos_cuentas_cobrar');
            $select = ['id'];
            foreach (['fecha', 'created_at', 'fecha_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['monto_pagado', 'monto', 'valor', 'importe'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['metodo', 'metodo_pago', 'tipo', 'forma_pago'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['comprobante', 'referencia', 'nota'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['user_id', 'usuario_id', 'created_by'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            foreach (['cuenta_cobrar_id','venta_id'] as $c) if (in_array($c, $pcCols)) $select[] = $c;
            // permitir resolver banco por id si existe la columna
            foreach (['cuenta_bancaria_id', 'banco_id'] as $c) if (in_array($c, $pcCols)) $select[] = $c;

            $q = DB::table('pagos_cuentas_cobrar')->select(array_unique($select))->orderBy('id','asc');

            if (!empty($mes)) {
                try {
                    $start = \Carbon\Carbon::createFromFormat('Y-m', $mes)->startOfMonth();
                    $end = \Carbon\Carbon::createFromFormat('Y-m', $mes)->endOfMonth();
                    if (in_array('fecha_pago', $pcCols)) {
                        $q->whereBetween('fecha_pago', [$start->toDateString(), $end->toDateString()]);
                    } elseif (in_array('fecha', $pcCols)) {
                        $q->whereBetween('fecha', [$start->toDateString(), $end->toDateString()]);
                    } elseif (in_array('created_at', $pcCols)) {
                        $q->whereBetween('created_at', [$start->startOfDay()->toDateTimeString(), $end->endOfDay()->toDateTimeString()]);
                    }
                } catch (\Throwable $e) {
                    // ignore filtro inválido
                }
            }

            $raw = $q->get();

            // Cache local para no pegarle a la DB por cada fila
            $bancoCache = [];

            $pagos = [];
            $montoTotal = 0.0;
            foreach ($raw as $r) {
                $row = (array)$r;
                $m = 0.0;
                foreach (['monto_pagado','monto','valor','importe'] as $c) {
                    if (array_key_exists($c, $row) && $row[$c] !== null) { $m = (float)$row[$c]; break; }
                }
                $montoTotal += $m;

                // resolver usuario en users/usuarios
                $uid = $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null));
                $usuarioNombre = $this->resolveUsuarioNombre($uid);

                $cuentaNumero = null;
                $bancoNombre = null;
                $bancoFuente = null;

                // 0) PRIORIDAD: si el pago ya trae banco_id, resolverlo DIRECTO desde cuentas_bancarias.id
                $bancoIdRow = $row['banco_id'] ?? null;
                if (!empty($bancoIdRow) && \Schema::hasTable('cuentas_bancarias')) {
                    try {
                        if (!array_key_exists((string)$bancoIdRow, $bancoCache)) {
                            $cbCols = [];
                            try { $cbCols = \Schema::getColumnListing('cuentas_bancarias'); } catch (\Throwable $__ ) {}

                            // detectar la mejor columna "nombre de banco" disponible
                            $candidatos = [
                                'banco',
                                'banco_nombre',
                                'nombre_banco',
                                'nombre',
                                'alias',
                                'nombre_cuenta',
                                'titular',
                                'numero_cuenta',
                            ];
                            $selectCols = [];
                            foreach ($candidatos as $c) {
                                if (in_array($c, $cbCols)) $selectCols[] = $c;
                            }
                            if (empty($selectCols)) $selectCols = ['id'];

                            $bn = DB::table('cuentas_bancarias')->where('id', $bancoIdRow)->select($selectCols)->first();
                            $bancoCache[(string)$bancoIdRow] = $bn ? (array)$bn : null;
                        }

                        $bnArr = $bancoCache[(string)$bancoIdRow];
                        if (!empty($bnArr)) {
                            // mismo orden de prioridad que el resolver general
                            foreach (['banco','banco_nombre','nombre_banco','alias','nombre','nombre_cuenta','titular'] as $bf) {
                                if (!empty($bnArr[$bf])) { $bancoNombre = (string)$bnArr[$bf]; $bancoFuente = 'pago:banco_id'; break; }
                            }
                            if (empty($bancoNombre) && !empty($bnArr['numero_cuenta'])) {
                                $bancoNombre = (string)$bnArr['numero_cuenta'];
                                $bancoFuente = 'pago:banco_id:numero_cuenta';
                            }
                        }
                    } catch (\Throwable $__) { /* ignore */ }
                }

                // 0b) Fallback: si no hay banco_id pero sí cuenta_bancaria_id, resolver también directo desde cuentas_bancarias.id
                if (empty($bancoNombre)) {
                    $cuentaBancariaRow = $row['cuenta_bancaria_id'] ?? null;
                    if (!empty($cuentaBancariaRow) && \Schema::hasTable('cuentas_bancarias')) {
                        try {
                            $cacheKey = 'cb:' . (string)$cuentaBancariaRow;
                            if (!array_key_exists($cacheKey, $bancoCache)) {
                                $bn = DB::table('cuentas_bancarias')->where('id', $cuentaBancariaRow)->select('banco','alias','nombre','nombre_cuenta','titular','numero_cuenta')->first();
                                $bancoCache[$cacheKey] = $bn ? (array)$bn : null;
                            }
                            $bnArr = $bancoCache[$cacheKey];
                            if (!empty($bnArr)) {
                                foreach (['banco','alias','nombre','nombre_cuenta','titular'] as $bf) {
                                    if (!empty($bnArr[$bf])) { $bancoNombre = (string)$bnArr[$bf]; $bancoFuente = 'pago:cuenta_bancaria_id'; break; }
                                }
                                if (empty($bancoNombre) && !empty($bnArr['numero_cuenta'])) {
                                    $bancoNombre = (string)$bnArr['numero_cuenta'];
                                    $bancoFuente = 'pago:cuenta_bancaria_id:numero_cuenta';
                                }
                            }
                        } catch (\Throwable $__) { /* ignore */ }
                    }
                }

                // 1) Si no se pudo por banco_id, usar el flujo existente (cuentas_cobrar/venta/cuenta_bancaria_id)
                if (empty($bancoNombre)) {
                    try {
                        if (!empty($row['cuenta_cobrar_id']) && \Schema::hasTable('cuentas_cobrar')) {
                            $cc = DB::table('cuentas_cobrar')
                                ->where('id', $row['cuenta_cobrar_id'])
                                ->select('numero','numero_documento','nro_documento','documento','folio','referencia','monto_total','cuenta_bancaria_id','venta_id')
                                ->first();
                            if ($cc) {
                                $ventaId = $row['venta_id'] ?? ($cc->venta_id ?? null);
                                $cuentaBancariaId = $row['cuenta_bancaria_id'] ?? ($cc->cuenta_bancaria_id ?? null);
                                $bancoId = $row['banco_id'] ?? null;

                                $bancoNombre = $this->resolveBancoNombre(
                                    $ventaId ? (int)$ventaId : null,
                                    $cuentaBancariaId ? (int)$cuentaBancariaId : null,
                                    (int)$row['cuenta_cobrar_id'],
                                    $bancoFuente,
                                    $bancoId ? (int)$bancoId : null
                                );

                                if (empty($bancoNombre) && !empty($cuentaBancariaId)) {
                                    $bancoNombre = 'Cuenta #' . $cuentaBancariaId;
                                    $bancoFuente = $bancoFuente ?? 'fallback:cuenta_bancaria_id';
                                } elseif (empty($bancoNombre) && !empty($bancoId)) {
                                    $bancoNombre = 'Cuenta #' . $bancoId;
                                    $bancoFuente = $bancoFuente ?? 'fallback:banco_id';
                                }

                                // Si no se obtuvo nombre del banco, seguir buscando campos legibles en cuentas_cobrar
                                if (empty($bancoNombre)) {
                                    foreach (['numero','numero_documento','nro_documento','documento','folio','referencia'] as $f) {
                                        if (!empty($cc->{$f})) { $cuentaNumero = $cc->{$f}; $bancoFuente = 'cuentas_cobrar'; break; }
                                    }
                                    if (empty($cuentaNumero) && !empty($cc->venta_id)) {
                                        try {
                                            $v = DB::table('ventas')->where('id', $cc->venta_id)->select('numero','folio','folio_completo','codigo','serie','documento','numero_documento','numero_venta')->first();
                                            if ($v) {
                                                foreach (['folio_completo','numero','folio','codigo','serie','numero_documento','documento','numero_venta'] as $vf) {
                                                    if (!empty($v->{$vf})) { $cuentaNumero = $v->{$vf}; $bancoFuente = 'venta'; break; }
                                                }
                                            }
                                        } catch (\Throwable $__) { /* ignore */ }
                                    }
                                }

                                if (empty($bancoNombre) && empty($cuentaNumero)) { $cuentaNumero = (string)$row['cuenta_cobrar_id']; $bancoFuente = 'fallback:id'; }
                            }
                        }
                    } catch (\Throwable $__) { $cuentaNumero = null; }
                }

                // Si el pago no trae venta_id, intentar obtenerla desde cuentas_cobrar
                if ((empty($row['venta_id']) || $row['venta_id'] === null) && !empty($row['cuenta_cobrar_id']) && \Schema::hasTable('cuentas_cobrar')) {
                    try {
                        $ccVenta = DB::table('cuentas_cobrar')->where('id', $row['cuenta_cobrar_id'])->select('venta_id','cuenta_bancaria_id')->first();
                        if ($ccVenta) {
                            if (!empty($ccVenta->venta_id)) $row['venta_id'] = $ccVenta->venta_id;
                            if (empty($row['cuenta_bancaria_id']) && !empty($ccVenta->cuenta_bancaria_id)) {
                                $row['cuenta_bancaria_id'] = $ccVenta->cuenta_bancaria_id;
                            }
                        }
                    } catch (\Throwable $__) { /* ignore */ }
                }

                $displayCuenta = $bancoNombre ?? $cuentaNumero ?? null;
                $displayFuente = $bancoFuente ?? null;
                if (empty($displayCuenta) && !empty($row['cuenta_cobrar_id'])) {
                    $displayCuenta = 'Cuenta #' . $row['cuenta_cobrar_id'];
                    $displayFuente = $displayFuente ?? 'fallback:cuenta';
                }

                $pagos[] = [
                    'id' => $row['id'] ?? null,
                    'fecha_pago' => $row['fecha_pago'] ?? ($row['fecha'] ?? ($row['created_at'] ?? null)),
                    'monto' => $m,
                    'monto_pagado' => $m,
                    'metodo_pago' => $row['metodo_pago'] ?? ($row['metodo'] ?? ($row['tipo'] ?? null)),
                    'comprobante' => $row['referencia'] ?? ($row['comprobante'] ?? ($row['nota'] ?? null)),
                    'cuenta_cobrar_id' => $row['cuenta_cobrar_id'] ?? null,
                    'venta_id' => $row['venta_id'] ?? null,
                    'usuario_id' => $row['user_id'] ?? ($row['usuario_id'] ?? ($row['created_by'] ?? null)),
                    'usuario' => $usuarioNombre,
                    'cuenta_numero' => $displayCuenta,
                    'banco_id' => $row['banco_id'] ?? null,
                    'banco_nombre' => $bancoNombre,
                    'banco_fuente' => $displayFuente ?? null,
                    'raw' => $row,
                ];
            }

            return response()->json(['pagos' => $pagos, 'monto_total' => $montoTotal]);
        } catch (\Throwable $e) {
            try { Log::error('CuentasCobrarController@pagosHistorico error', ['error' => $e->getMessage()]); } catch (\Throwable $__) {}
            return response()->json(['pagos' => [], 'monto_total' => 0]);
        }
    }
}
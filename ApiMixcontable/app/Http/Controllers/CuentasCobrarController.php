<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CuentasCobrarController extends Controller
{
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
                'created_at' => now(),
                'updated_at' => now(),
            ];

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
                        // Determinar cuenta bancaria destino: preferir campo explícito enviado por frontend
                        $cuentaBancoId = $data['cuenta_bancaria_id'] ?? $data['cuenta_id_banco'] ?? $data['cuentaId'] ?? $data['cuenta_id'] ?? null;
                        if (!$cuentaBancoId) {
                            $cuentaBancoId = DB::table('cuentas_bancarias')->value('id');
                        }

                        if ($cuentaBancoId) {
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

                            // Construir el base sin asegurar 'categoria' aún
                            $base = [
                                'cuenta_id' => $cuentaBancoId,
                                'user_id' => $request->user()?->id ?? null,
                                'fecha' => $data['fecha_pago'] ?? date('Y-m-d'),
                                'monto' => (float) $monto,
                                'descripcion' => 'Cobro cuenta por cobrar #' . $cuentaId,
                                'tipo_movimiento' => 'INGRESO',
                                'referencia' => $data['comprobante'] ?? null,
                                'observaciones' => $data['observaciones'] ?? null,
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
                                        } else {
                                            // omit categoria to avoid SQL warnings; DB default will apply
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
            ];

            return response()->json(['pago' => $pagoResp, 'cuenta' => $cuentaActualizada], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registrando pago cxc', ['error' => $e->getMessage(), 'payload' => $data]);
            return response()->json(['message' => 'Error al registrar pago', 'error' => $e->getMessage()], 500);
        }
    }
}
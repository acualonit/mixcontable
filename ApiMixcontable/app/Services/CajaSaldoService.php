<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CajaSaldoService
{
    public static function recomputeSaldoActual(int $cajaId = 1): float
    {
        try {
            if (!Schema::hasTable('caja_efectivo')) {
                Log::warning('CajaSaldoService: tabla caja_efectivo no existe');
                return 0.0;
            }

            $caja = DB::table('caja_efectivo')
                ->where('id', $cajaId)
                ->first();

            if (!$caja) {
                Log::warning('CajaSaldoService: caja no encontrada', ['cajaId' => $cajaId]);
                return 0.0;
            }

            // detectar columnas reales en movimientos_caja
            $movCols = Schema::hasTable('movimientos_caja') ? Schema::getColumnListing('movimientos_caja') : [];
            $tipoCol = in_array('tipo_movimiento', $movCols) ? 'tipo_movimiento' : (in_array('tipo', $movCols) ? 'tipo' : null);
            $montoCol = in_array('monto', $movCols) ? 'monto' : null;
            $movDeleted = in_array('deleted_at', $movCols) ? 'deleted_at' : null;

            $mov = 0.0;
            if ($tipoCol && $montoCol) {
                $movQuery = DB::table('movimientos_caja')->where('caja_id', $cajaId);
                if ($movDeleted) {
                    $movQuery->whereNull('deleted_at');
                }

                $mov = (float) $movQuery
                    ->selectRaw("COALESCE(SUM(CASE WHEN {$tipoCol} IN ('INGRESO','ingreso') THEN {$montoCol} WHEN {$tipoCol} IN ('EGRESO','egreso') THEN -{$montoCol} ELSE 0 END),0) as s")
                    ->value('s');
            } else {
                Log::warning('CajaSaldoService: columnas tipo/monto no detectadas en movimientos_caja', ['cols' => $movCols]);
            }

            // Ventas: detectar columna de método de pago y de total
            $ventasCols = Schema::hasTable('ventas') ? Schema::getColumnListing('ventas') : [];
            $mpCol = in_array('metodos_pago', $ventasCols) ? 'metodos_pago' : (in_array('metodo_pago', $ventasCols) ? 'metodo_pago' : null);
            $totalCol = in_array('total', $ventasCols) ? 'total' : null;
            $ventasDeleted = in_array('deleted_at', $ventasCols) ? 'deleted_at' : null;

            $ventas = 0.0;
            if ($totalCol) {
                $ventasQuery = DB::table('ventas');
                if ($ventasDeleted) {
                    $ventasQuery->whereNull('deleted_at');
                }

                // Contar SOLO ventas pagadas en EFECTIVO (no considerar Transferencia, Tarjeta, Online, Crédito, Cheque)
                if ($mpCol) {
                    $ventasQuery->where($mpCol, 'Efectivo');

                    // Excluir ventas que ya tienen un movimiento en movimientos_caja con origen = 'venta:{id}'
                    if (Schema::hasTable('movimientos_caja')) {
                        $movCols2 = Schema::getColumnListing('movimientos_caja');
                        if (in_array('origen', $movCols2)) {
                            $ventasQuery->whereRaw("NOT EXISTS (SELECT 1 FROM movimientos_caja mc WHERE mc.origen = CONCAT('venta:', ventas.id) AND mc.caja_id = ?" . (in_array('deleted_at', $movCols2) ? " AND mc.deleted_at IS NULL" : "") . ")", [$cajaId]);
                        }
                    }
                } else {
                    // si no hay columna de método, no podemos saber; excluir ventas de impacto en caja
                    $ventasQuery->whereRaw('1 = 0');
                }

                $ventas = (float)$ventasQuery->selectRaw("COALESCE(SUM({$totalCol}),0) as s")->value('s');
            } else {
                Log::warning('CajaSaldoService: columna total no detectada en ventas', ['cols' => $ventasCols]);
            }

            $saldoActual = $mov + $ventas;

            // Columna destino: preferir saldo_actual si existe; fallback a saldo_inicial
            $targetCol = null;
            if (Schema::hasColumn('caja_efectivo', 'saldo_actual')) {
                $targetCol = 'saldo_actual';
            } elseif (Schema::hasColumn('caja_efectivo', 'saldo_inicial')) {
                $targetCol = 'saldo_inicial';
            }

            if (!$targetCol) {
                Log::warning('CajaSaldoService: caja_efectivo sin columna saldo_actual/saldo_inicial');
                return (float)$saldoActual;
            }

            $update = [$targetCol => $saldoActual];
            if (Schema::hasColumn('caja_efectivo', 'updated_at')) {
                $update['updated_at'] = now();
            }
            // NO tocar deleted_at (en tu esquema tiene ON UPDATE current_timestamp en algunos casos)

            $affected = DB::table('caja_efectivo')->where('id', $cajaId)->update($update);

            Log::info('CajaSaldoService: saldo actualizado', [
                'cajaId' => $cajaId,
                'targetCol' => $targetCol,
                'saldoActual' => $saldoActual,
                'movimientos' => $mov,
                'ventas' => $ventas,
                'affected' => $affected,
            ]);

            return (float)$saldoActual;
        } catch (\Throwable $e) {
            Log::error('CajaSaldoService: error recomputando saldo', [
                'cajaId' => $cajaId,
                'error' => $e->getMessage(),
            ]);
            return 0.0;
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\CajaSaldoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CajaEfectivoController extends Controller
{
    public function syncSaldo(Request $request)
    {
        // por ahora caja fija 1
        $saldo = CajaSaldoService::recomputeSaldoActual(1);

        $field = 'saldo_inicial';
        if (Schema::hasColumn('caja_efectivo', 'saldo_actual')) {
            $field = 'saldo_actual';
        }

        return response()->json(['caja_id' => 1, $field => (float)$saldo]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Cheque;

class ChequeController extends Controller
{
    public function index(Request $request)
    {
        // Siempre unir con cuentas_bancarias para exponer nombre de banco y número de cuenta
        $query = DB::table('cheques')
            ->leftJoin('cuentas_bancarias', 'cheques.cuenta_id', '=', 'cuentas_bancarias.id')
            ->select('cheques.*', 'cuentas_bancarias.banco as cuenta_banco', 'cuentas_bancarias.numero_cuenta as cuenta_numero');

        // Filtrado: normalizamos comparaciones a minúsculas para mayor tolerancia
        if ($request->filled('estado')) {
            $estado = strtolower($request->get('estado'));
            $query->whereRaw('LOWER(cheques.estado) = ?', [$estado]);
        }

        if ($request->filled('fecha_cobro')) {
            $query->where('cheques.fecha_cobro', $request->get('fecha_cobro'));
        }

        if ($request->filled('banco')) {
            // permitir buscar por "Banco - numero_cuenta" o por banco o por numero
            $banco = strtolower($request->get('banco'));
            $query->where(function($q) use ($banco) {
                $q->whereRaw('LOWER(CONCAT(cuentas_bancarias.banco, " - ", cuentas_bancarias.numero_cuenta)) LIKE ?', ["%{$banco}%"])
                  ->orWhereRaw('LOWER(cuentas_bancarias.banco) = ?', [$banco])
                  ->orWhere('cuentas_bancarias.numero_cuenta', $banco);
            });
        }

        if ($request->filled('tipo')) {
            $tipo = strtolower($request->get('tipo'));
            // Hacer comparación flexible: 'emitid' coincide con 'emitido'/'emitidos'
            $tipoLike = "%{$tipo}%";
            $query->whereRaw('LOWER(cheques.tipo) LIKE ?', [$tipoLike]);
        }

        $cheques = $query->orderBy('cheques.created_at', 'desc')->get();

        return response()->json(['data' => $cheques]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cuenta_id' => ['nullable','integer'],
            'numero_cheque' => ['required','string'],
            'fecha_emision' => ['required','date'],
            'fecha_cobro' => ['nullable','date'],
            'beneficiario' => ['nullable','string'],
            'concepto' => ['nullable','string'],
            'monto' => ['required','numeric'],
            'estado' => ['nullable','string'],
            'observaciones' => ['nullable','string']
        ]);

        $data['estado'] = $data['estado'] ?? 'EMITIDO';
        // Si la tabla tiene columna id_sucursal, obtenerla desde la cuenta bancaria seleccionada
        if (Schema::hasColumn('cheques', 'id_sucursal')) {
            if (!empty($data['cuenta_id'])) {
                $cuenta = DB::table('cuentas_bancarias')->where('id', $data['cuenta_id'])->first();
                if ($cuenta && property_exists($cuenta, 'id_sucursal')) {
                    $data['id_sucursal'] = $cuenta->id_sucursal;
                } elseif ($cuenta && property_exists($cuenta, 'id_sucursal') === false && property_exists($cuenta, 'id_sucursal') !== null) {
                    // fallback: if cuenta has id_sucursal under different name (id_sucursal may be id_sucursal)
                    $data['id_sucursal'] = $cuenta->id_sucursal ?? null;
                }
            }
        } else {
            // Ensure we don't try to set id_sucursal if column doesn't exist
            if (isset($data['id_sucursal'])) unset($data['id_sucursal']);
        }

        $cheque = Cheque::create($data);

        return response()->json(['data' => $cheque], 201);
    }

    public function show($id)
    {
        // Obtener cheque junto con datos de la cuenta bancaria (banco y numero de cuenta)
        $item = DB::table('cheques')
            ->leftJoin('cuentas_bancarias', 'cheques.cuenta_id', '=', 'cuentas_bancarias.id')
            ->select('cheques.*', 'cuentas_bancarias.banco as cuenta_banco', 'cuentas_bancarias.numero_cuenta as cuenta_numero')
            ->where('cheques.id', $id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        return response()->json(['data' => $item]);
    }

    public function update(Request $request, Cheque $cheque)
    {
        $data = $request->validate([
            'cuenta_id' => ['nullable','integer'],
            'numero_cheque' => ['nullable','string'],
            'fecha_emision' => ['nullable','date'],
            'fecha_cobro' => ['nullable','date'],
            'beneficiario' => ['nullable','string'],
            'concepto' => ['nullable','string'],
            'monto' => ['nullable','numeric'],
            'estado' => ['nullable','string'],
            'observaciones' => ['nullable','string']
        ]);

        // Para update también asignar id_sucursal desde la cuenta si corresponde
        if (Schema::hasColumn('cheques', 'id_sucursal')) {
            if (!empty($data['cuenta_id'])) {
                $cuenta = DB::table('cuentas_bancarias')->where('id', $data['cuenta_id'])->first();
                if ($cuenta && property_exists($cuenta, 'id_sucursal')) {
                    $data['id_sucursal'] = $cuenta->id_sucursal;
                } else {
                    $data['id_sucursal'] = $cuenta->id_sucursal ?? null;
                }
            }
        } else {
            if (isset($data['id_sucursal'])) unset($data['id_sucursal']);
        }

        $cheque->update($data);

        return response()->json(['data' => $cheque]);
    }

    public function destroy(Cheque $cheque)
    {
        $cheque->delete();
        return response()->json(['message' => 'Cheque anulado/eliminado']);
    }

    public function cobrar(Request $request, Cheque $cheque)
    {
        // Cambiar estado a COBRADO y opcionalmente registrar movimiento bancario
        $cheque->estado = 'COBRADO';
        if ($request->filled('fecha_cobro')) {
            $cheque->fecha_cobro = $request->get('fecha_cobro');
        }
        $cheque->save();

        return response()->json(['data' => $cheque]);
    }

    public function restore($id)
    {
        $cheque = Cheque::withTrashed()->find($id);
        if (!$cheque) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        if ($cheque->trashed()) {
            $cheque->restore();
        }

        // Devolver el registro restaurado
        $restored = Cheque::find($id);
        return response()->json(['data' => $restored]);
    }
}

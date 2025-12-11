<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProveedorController extends Controller
{
    public function index()
    {
        return response()->json(Proveedor::orderBy('razon_social')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'rut' => ['required', 'string', 'max:20'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'pagina_web' => ['nullable', 'string', 'max:255'],
            'giro' => ['nullable', 'string', 'max:255'],
            'direccion' => ['required', 'string', 'max:255'],
            'comuna' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'ciudad' => ['required', 'string', 'max:255'],
            'correo' => ['required', 'email', 'max:255'],
            'correo_finanzas' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'celular' => ['nullable', 'string', 'max:20'],
            'nombre_vendedor' => ['nullable', 'string', 'max:255'],
            'celular_vendedor' => ['nullable', 'string', 'max:20'],
            'correo_vendedor' => ['nullable', 'email', 'max:255'],
            'metodo_pago' => ['nullable', 'in:efectivo,cheque,transferencia'],
            'banco_nombre_titular' => ['nullable', 'string', 'max:255'],
            'banco_rut_titular' => ['nullable', 'string', 'max:20'],
            'banco_nombre' => ['nullable', 'string', 'max:100'],
            'banco_tipo_cuenta' => ['nullable', 'string', 'max:50'],
            'banco_numero_cuenta' => ['nullable', 'string', 'max:50'],
            'banco_correo' => ['nullable', 'email', 'max:255'],
            'limite_credito' => ['nullable', 'numeric'],
            'comentario' => ['nullable', 'string'],
            'condicion_pago' => ['nullable', 'string', 'max:255'],
            'observacion' => ['nullable', 'string'],
                // 'giro' removed - not present in DB
        ]);

        $data['estado'] = $data['estado'] ?? 'activo';
        $data['historial_estados'] = [
            [
                'fecha' => now()->toDateTimeString(),
                'usuario' => Auth::user()->name ?? 'Sistema',
                'accion' => 'Creación',
                'detalles' => 'Creación inicial del proveedor',
            ],
        ];

        $proveedor = Proveedor::create($data);

        return response()->json(['message' => 'Proveedor creado', 'proveedor' => $proveedor], 201);
    }

    public function show(Proveedor $proveedor)
    {
        return response()->json($proveedor);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $data = $request->validate([
            'rut' => ['required', 'string', 'max:20'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'pagina_web' => ['nullable', 'string', 'max:255'],
            'giro' => ['nullable', 'string', 'max:255'],
            'direccion' => ['required', 'string', 'max:255'],
            'comuna' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'ciudad' => ['required', 'string', 'max:255'],
            'correo' => ['required', 'email', 'max:255'],
            'correo_finanzas' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'celular' => ['nullable', 'string', 'max:20'],
            'nombre_vendedor' => ['nullable', 'string', 'max:255'],
            'celular_vendedor' => ['nullable', 'string', 'max:20'],
            'correo_vendedor' => ['nullable', 'email', 'max:255'],
            'metodo_pago' => ['nullable', 'in:efectivo,cheque,transferencia'],
            'banco_nombre_titular' => ['nullable', 'string', 'max:255'],
            'banco_rut_titular' => ['nullable', 'string', 'max:20'],
            'banco_nombre' => ['nullable', 'string', 'max:100'],
            'banco_tipo_cuenta' => ['nullable', 'string', 'max:50'],
            'banco_numero_cuenta' => ['nullable', 'string', 'max:50'],
            'banco_correo' => ['nullable', 'email', 'max:255'],
            'limite_credito' => ['nullable', 'numeric'],
            'comentario' => ['nullable', 'string'],
            'condicion_pago' => ['nullable', 'string', 'max:255'],
            'observacion' => ['nullable', 'string'],
        ]);

        $proveedor->update($data);

        return response()->json(['message' => 'Proveedor actualizado', 'proveedor' => $proveedor]);
    }

    public function destroy(Proveedor $proveedor)
    {
        // mark inactive only, do not delete
        $nuevoHistorial = array_merge($proveedor->historial_estados ?? [], [[
            'fecha' => now()->toDateTimeString(),
            'usuario' => Auth::user()->name ?? 'Sistema',
            'accion' => 'Inactivación',
            'detalles' => 'Proveedor inactivado',
        ]]);

        $proveedor->update([
            'estado' => 'inactivo',
            'historial_estados' => $nuevoHistorial,
        ]);

        return response()->json(['message' => 'Proveedor inactivado']);
    }
}

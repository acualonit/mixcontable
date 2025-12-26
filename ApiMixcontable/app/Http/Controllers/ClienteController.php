<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Cliente::query();

        // Búsqueda por rut o término q
        if ($request->filled('rut')) {
            $rut = $request->get('rut');
            $query->where('rut', 'like', "%{$rut}%");
        }

        if ($request->filled('q')) {
            $q = $request->get('q');
            $query->where(function($qbuilder) use ($q) {
                $qbuilder->where('razon_social', 'like', "%{$q}%")
                    ->orWhere('nombre_fantasia', 'like', "%{$q}%")
                    ->orWhere('rut', 'like', "%{$q}%");
            });
        }

        $clientes = $query->orderBy('razon_social')->get();
        return response()->json($clientes);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'rut' => ['nullable', 'string', 'max:50'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_fantasia' => ['nullable', 'string', 'max:255'],
            'giro' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'comuna' => ['nullable', 'string', 'max:100'],
            'region' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'contacto_cobranza' => ['nullable', 'string', 'max:150'],
            'tel_cobranza' => ['nullable', 'string', 'max:50'],
            'email_cobranza' => ['nullable', 'email', 'max:150'],
            'contacto_principal' => ['nullable', 'string', 'max:255'],
            'telefono_principal' => ['nullable', 'string', 'max:100'],
            'email_principal' => ['nullable', 'email', 'max:255'],
            'limite_credito' => ['nullable', 'numeric'],
            'condicion_venta' => ['nullable', 'string', 'max:255'],
            'observacion' => ['nullable', 'string'],
        ]);

        $data['estado'] = $data['estado'] ?? 'activo';
        $data['historial_estados'] = [
            [
                'fecha' => now()->toDateTimeString(),
                'usuario' => Auth::user()->name ?? 'Sistema',
                'accion' => 'Creación',
                'detalles' => 'Creación inicial del cliente',
            ],
        ];

        $cliente = Cliente::create($data);

        return response()->json(['message' => 'Cliente creado', 'cliente' => $cliente], 201);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $data = $request->validate([
            'rut' => ['nullable', 'string', 'max:50'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_fantasia' => ['nullable', 'string', 'max:255'],
            'giro' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'comuna' => ['nullable', 'string', 'max:100'],
            'region' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'contacto_cobranza' => ['nullable', 'string', 'max:150'],
            'tel_cobranza' => ['nullable', 'string', 'max:50'],
            'email_cobranza' => ['nullable', 'email', 'max:150'],
            'contacto_principal' => ['nullable', 'string', 'max:255'],
            'telefono_principal' => ['nullable', 'string', 'max:100'],
            'email_principal' => ['nullable', 'email', 'max:255'],
            'limite_credito' => ['nullable', 'numeric'],
            'condicion_venta' => ['nullable', 'string', 'max:255'],
            'observacion' => ['nullable', 'string'],
        ]);

        $cliente->update($data);

        return response()->json(['message' => 'Cliente actualizado', 'cliente' => $cliente]);
    }

    public function destroy(Cliente $cliente)
    {
        // marcar estado como inactivo y actualizar historial, sin borrar (no soft-delete)
        $nuevoHistorial = array_merge($cliente->historial_estados ?? [], [[
            'fecha' => now()->toDateTimeString(),
            'usuario' => Auth::user()->name ?? 'Sistema',
            'accion' => 'Inactivación',
            'detalles' => 'Cliente inactivado',
        ]]);

        $cliente->update([
            'estado' => 'inactivo',
            'historial_estados' => $nuevoHistorial,
        ]);

        return response()->json(['message' => 'Cliente inactivado']);
    }

    public function show(Cliente $cliente)
    {
        return response()->json($cliente);
    }

    /**
     * Obtener historial de clientes inactivos (incluye soft-deleted y registros con estado 'inactivo')
     */
    public function inactivos(Request $request)
    {
        // devolver clientes cuyo estado sea 'inactivo' (no depende de deleted_at)
        $query = Cliente::where('estado', 'inactivo')->orderBy('updated_at', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->where('updated_at', '>=', $request->input('fecha_inicio'));
        }
        if ($request->filled('fecha_fin')) {
            $query->where('updated_at', '<=', $request->input('fecha_fin'));
        }

        $clientes = $query->get();

        return response()->json($clientes);
    }
}

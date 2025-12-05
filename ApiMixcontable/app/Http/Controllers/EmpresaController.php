<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index()
    {
        $empresas = Empresa::with('sucursales')->orderBy('nombre')->get();

        return response()->json($empresas);
    }

    public function store(Request $request)
    {
        $data = $this->validateEmpresa($request);
        $empresa = Empresa::create($data);

        return response()->json([
            'message' => 'Empresa creada correctamente',
            'empresa' => $empresa->fresh('sucursales'),
        ], 201);
    }

    public function update(Request $request, Empresa $empresa)
    {
        $data = $this->validateEmpresa($request);
        $empresa->update($data);

        return response()->json([
            'message' => 'Empresa actualizada',
            'empresa' => $empresa->fresh('sucursales'),
        ]);
    }

    public function destroy(Empresa $empresa)
    {
        $empresa->delete();

        return response()->json(['message' => 'Empresa eliminada']);
    }

    private function validateEmpresa(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'rut' => ['nullable', 'string', 'max:32'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'moneda' => ['required', 'string', 'max:10'],
            'iva' => ['required', 'integer', 'min:0', 'max:100'],
        ]);
    }
}

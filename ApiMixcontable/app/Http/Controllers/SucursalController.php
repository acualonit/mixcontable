<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    public function index(Empresa $empresa)
    {
        return response()->json(
            $empresa->sucursales()->orderBy('nombre')->get()
        );
    }

    public function store(Request $request, Empresa $empresa)
    {
        $data = $this->validateSucursal($request);
        $sucursal = $empresa->sucursales()->create($data);

        return response()->json([
            'message' => 'Sucursal creada',
            'sucursal' => $sucursal,
        ], 201);
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $data = $this->validateSucursal($request);
        $sucursal->update($data);

        return response()->json([
            'message' => 'Sucursal actualizada',
            'sucursal' => $sucursal,
        ]);
    }

    public function destroy(Sucursal $sucursal)
    {
        $sucursal->delete();

        return response()->json(['message' => 'Sucursal eliminada']);
    }

    private function validateSucursal(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
        ]);
    }
}

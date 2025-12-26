<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    // Listar todas las sucursales (sin filtrar por empresa)
    public function all()
    {
        // Log para depuración: origen de la petición y si hay usuario autenticado
        try {
            Log::info('GET /api/public/sucursales called', [
                'ip' => request()->ip(),
                'has_user' => auth()->check() ?? false,
            ]);
        } catch (\Throwable $e) {
            // evitar que falle si auth() no está disponible
            Log::info('GET /api/public/sucursales called (log fallback)');
        }

        $list = Sucursal::orderBy('nombre')->get();
        return response()->json($list);
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

<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index()
    {
        return response()->json(
            User::with('sucursal')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateUser($request);
        $temporaryPassword = $data['password'] ?? Str::random(10);
        $plainPassword = $data['password'] ?? null;
        $data['password'] = Hash::make($temporaryPassword);

        $user = User::create($data);

        return response()->json([
            'message' => 'Usuario creado',
            'user' => $user->fresh()->load('sucursal'),
            'temporary_password' => $request->filled('password') ? $plainPassword : $temporaryPassword,
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $this->validateUser($request, $user->id);

        $isDisablingAdmin = $this->isDisablingLastAdmin($user, $data);
        if ($isDisablingAdmin) {
            return response()->json([
                'message' => 'Debe existir al menos un administrador activo',
            ], 422);
        }

        $plainPassword = null;
        if (!empty($data['password'])) {
            $plainPassword = $data['password'];
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'message' => 'Usuario actualizado',
            'user' => $user->fresh()->load('sucursal'),
            'temporary_password' => $plainPassword,
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'No puedes eliminar tu propio usuario',
            ], 422);
        }

        if ($user->role === 'ADMINISTRADOR' && $user->status === 'ACTIVO' && !$this->hasAnotherActiveAdmin($user->id)) {
            return response()->json([
                'message' => 'Debe permanecer al menos un administrador activo',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        $newPassword = $request->input('password') ?: Str::random(10);
        $user->update(['password' => Hash::make($newPassword)]);

        return response()->json([
            'message' => 'Contraseña actualizada',
            'temporary_password' => $request->filled('password') ? null : $newPassword,
        ]);
    }

    private function validateUser(Request $request, ?int $userId = null): array
    {
        $uniqueEmail = Rule::unique('users', 'email');

        if ($userId) {
            $uniqueEmail->ignore($userId);
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', $uniqueEmail],
            'role' => ['required', Rule::in(['ADMINISTRADOR', 'SUPERVISOR', 'VENDEDOR'])],
            'status' => ['required', Rule::in(['ACTIVO', 'INACTIVO'])],
            'password' => ['nullable', 'string', 'min:6'],
        ]);
    }

    private function isDisablingLastAdmin(User $user, array $data): bool
    {
        $role = $data['role'] ?? $user->role;
        $status = $data['status'] ?? $user->status;

        if ($user->role !== 'ADMINISTRADOR' || $user->status !== 'ACTIVO') {
            return false;
        }

        $isLosingAdminRole = $role !== 'ADMINISTRADOR';
        $isBecomingInactive = $status !== 'ACTIVO';

        if (($isLosingAdminRole || $isBecomingInactive) && !$this->hasAnotherActiveAdmin($user->id)) {
            return true;
        }

        return false;
    }

    private function hasAnotherActiveAdmin(?int $ignoreId = null): bool
    {
        $query = User::where('role', 'ADMINISTRADOR')->where('status', 'ACTIVO');

        if ($ignoreId) {
            $query->where('id', '<>', $ignoreId);
        }

        return $query->exists();
    }
}

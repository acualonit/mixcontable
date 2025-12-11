<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\RespaldosController;
use App\Http\Controllers\SucursalController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\EfectivoController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí se registran las rutas de la API para MIXCONTABLE.
|
*/

Route::middleware('session')->group(function () {
    // Login de usuarios
    Route::post('/login', [AuthController::class, 'login']);

    // Ruta de comprobación rápida
    Route::get('/ping', function () {
        return response()->json(['pong' => true]);
    });

    // Ruta de login de desarrollo (solo en entorno local)
    Route::post('/dev-login', function (Request $request) {
        if (env('APP_ENV') !== 'local' && !env('APP_DEBUG')) {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        if ($user->status !== 'ACTIVO') {
            return response()->json(['message' => 'Usuario inactivo'], 423);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
        ]]);
    });

    // Rutas protegidas por sesión (puedes cambiar el middleware a sanctum/jwt luego)
    Route::middleware('auth:web')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Empresas
        Route::get('/empresas', [EmpresaController::class, 'index']);
        Route::post('/empresas', [EmpresaController::class, 'store']);
        Route::put('/empresas/{empresa}', [EmpresaController::class, 'update']);
        Route::delete('/empresas/{empresa}', [EmpresaController::class, 'destroy']);

        // Sucursales
        Route::get('/empresas/{empresa}/sucursales', [SucursalController::class, 'index']);
        Route::post('/empresas/{empresa}/sucursales', [SucursalController::class, 'store']);
        Route::put('/sucursales/{sucursal}', [SucursalController::class, 'update']);
        Route::delete('/sucursales/{sucursal}', [SucursalController::class, 'destroy']);

        // Usuarios
        Route::get('/usuarios', [UserManagementController::class, 'index']);
        Route::post('/usuarios', [UserManagementController::class, 'store']);
        Route::put('/usuarios/{user}', [UserManagementController::class, 'update']);
        Route::delete('/usuarios/{user}', [UserManagementController::class, 'destroy']);
        Route::post('/usuarios/{user}/reset-password', [UserManagementController::class, 'resetPassword']);

        // Clientes
        Route::get('/clientes', [\App\Http\Controllers\ClienteController::class, 'index']);
        Route::get('/clientes/inactivos', [\App\Http\Controllers\ClienteController::class, 'inactivos']);
        Route::post('/clientes', [\App\Http\Controllers\ClienteController::class, 'store']);
        Route::get('/clientes/{cliente}', [\App\Http\Controllers\ClienteController::class, 'show']);
        Route::put('/clientes/{cliente}', [\App\Http\Controllers\ClienteController::class, 'update']);
        Route::delete('/clientes/{cliente}', [\App\Http\Controllers\ClienteController::class, 'destroy']);

        // Proveedores
        Route::get('/proveedores', [\App\Http\Controllers\ProveedorController::class, 'index']);
        Route::post('/proveedores', [\App\Http\Controllers\ProveedorController::class, 'store']);
        Route::get('/proveedores/{proveedor}', [\App\Http\Controllers\ProveedorController::class, 'show']);
        Route::put('/proveedores/{proveedor}', [\App\Http\Controllers\ProveedorController::class, 'update']);
        Route::delete('/proveedores/{proveedor}', [\App\Http\Controllers\ProveedorController::class, 'destroy']);

        // Efectivo
        Route::get('/efectivo/saldo', [EfectivoController::class, 'saldo']);
        Route::get('/efectivo/movimientos', [EfectivoController::class, 'movimientos']);
        Route::get('/efectivo/eliminados', [EfectivoController::class, 'eliminados']);
        Route::post('/efectivo', [EfectivoController::class, 'store']);
        Route::put('/efectivo/{id}', [EfectivoController::class, 'update']);
        Route::delete('/efectivo/{id}', [EfectivoController::class, 'destroy']);

        // Respaldos
        Route::get('/respaldos', [RespaldosController::class, 'index']);
        Route::post('/respaldos', [RespaldosController::class, 'store']);
        Route::post('/respaldos/restaurar', [RespaldosController::class, 'restore']);
        Route::get('/respaldos/{respaldo}/descargar', [RespaldosController::class, 'download']);
        Route::delete('/respaldos/{respaldo}', [RespaldosController::class, 'destroy']);
    });
});

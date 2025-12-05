<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
	public function login(Request $request)
	{
		$request->validate([
			'email' => 'required|email',
			'password' => 'required|string',
		]);

		$credentials = $request->only('email', 'password');

		// Log ligero para depuración: registramos el intento de login (solo email)
		\Log::info('AuthController@login attempt', ['email' => $request->input('email'), 'ip' => $request->ip()]);

		if (!Auth::attempt($credentials)) {
			return response()->json(['message' => 'Credenciales inválidas'], 401);
		}

		$request->session()->regenerate();
		$user = $request->user();
		if ($user->status !== 'ACTIVO') {
			Auth::logout();
			return response()->json(['message' => 'Usuario inactivo'], 423);
		}

		return response()->json([
			'user' => [
				'id' => $user->id,
				'name' => $user->name,
				'email' => $user->email,
				'role' => $user->role,
				'status' => $user->status,
			],
		]);
	}

	public function me(Request $request)
	{
		$user = $request->user();

		if (!$user) {
			return response()->json(['message' => 'No autenticado'], 401);
		}

		return response()->json([
			'id' => $user->id,
			'name' => $user->name,
			'email' => $user->email,
			'role' => $user->role,
			'status' => $user->status,
		]);
	}

	public function logout(Request $request)
	{
		Auth::logout();
		$request->session()->invalidate();
		$request->session()->regenerateToken();

		return response()->json(['message' => 'Sesión cerrada']);
	}
}

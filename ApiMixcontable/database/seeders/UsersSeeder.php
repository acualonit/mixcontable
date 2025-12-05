<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
	public function run(): void
	{
		$users = [
			[
				'name' => 'Super Administrador',
				'username' => 'superadmin',
				'email' => 'superadmin@local',
				'password' => 'superadmin123',
				'role' => 'ADMINISTRADOR',
			],
			[
				'name' => 'Supervisor General',
				'username' => 'supervisor',
				'email' => 'supervisor@local',
				'password' => 'supervisor123',
				'role' => 'SUPERVISOR',
			],
			[
				'name' => 'Vendedor Demo',
				'username' => 'vendedor',
				'email' => 'vendedor@local',
				'password' => 'vendedor123',
				'role' => 'VENDEDOR',
			],
		];

		foreach ($users as $data) {
			User::updateOrCreate(
				['email' => $data['email']],
				[
					'name' => $data['name'],
					'username' => $data['username'],
					'password' => Hash::make($data['password']),
					'role' => $data['role'],
					'status' => 'ACTIVO',
				]
			);
		}
	}
}

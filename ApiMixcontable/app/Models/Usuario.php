<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
	use HasFactory, Notifiable;

	protected $table = 'usuarios';

	protected $fillable = [
		'username',
		'email',
		'password_hash',
		'nombre_completo',
		'rol',
		'esta_activo',
	];

	protected $hidden = [
		'password_hash',
	];

	public function getAuthPassword()
	{
		return $this->password_hash;
	}
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sucursales';

    protected $fillable = [
        'empresa_id',
        'nombre',
        'direccion',
        'telefono',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}

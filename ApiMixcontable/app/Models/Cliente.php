<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clientes';

    protected $fillable = [
        'rut',
        'razon_social',
        'nombre_fantasia',
        'giro',
        'ciudad',
        'comuna',
        'region',
        'direccion',
        'contacto_cobranza',
        'tel_cobranza',
        'email_cobranza',
        'contacto_principal',
        'telefono_principal',
        'email_principal',
        'limite_credito',
        'condicion_venta',
        'estado',
        'historial_estados',
        'observacion',
    ];

    protected $casts = [
        'historial_estados' => 'array',
        'limite_credito' => 'decimal:2',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'proveedores';

    protected $fillable = [
        'rut', 'razon_social', 'nombre_comercial', 'pagina_web', 'giro', 'direccion', 'comuna', 'region', 'ciudad',
        'correo', 'correo_finanzas', 'telefono', 'celular', 'nombre_vendedor', 'celular_vendedor', 'correo_vendedor',
        'metodo_pago', 'limite_credito', 'banco_nombre_titular', 'banco_rut_titular', 'banco_nombre', 'banco_tipo_cuenta', 'banco_numero_cuenta', 'banco_correo', 'comentario', 'condicion_pago', 'observacion', 'estado', 'historial_estados'
    ];

    protected $casts = [
        'historial_estados' => 'array',
        'limite_credito' => 'float',
    ];
}

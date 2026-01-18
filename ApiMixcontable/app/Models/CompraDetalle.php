<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompraDetalle extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'compras_detalle';

    // En el dump existe create_at/update_at, pero Eloquent espera created_at/updated_at.
    // Desactivamos timestamps para evitar writes a columnas inexistentes.
    public $timestamps = false;

    protected $fillable = [
        'compra_id',
        'descripcion_item',
        'cantidad',
        'costo_unitario',
        'descuento_porcentaje',
        'impuesto_porcentaje',
        'total_linea',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'costo_unitario' => 'decimal:4',
        'descuento_porcentaje' => 'decimal:2',
        'impuesto_porcentaje' => 'decimal:2',
        'total_linea' => 'decimal:2',
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VentaMetodoPago extends Model
{
    use HasFactory;

    protected $table = 'venta_metodos_pago';

    protected $fillable = [
        'venta_id',
        'metodos',
    ];

    protected $casts = [
        'metodos' => 'array',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VentaDetalle extends Model
{
	use HasFactory;

	protected $table = 'ventas_detalle';

	protected $fillable = [
		'venta_id',
		'producto_id',
		'descripcion',
		'cantidad',
		'precio_unitario',
		'total_linea',
	];

	protected $casts = [
		'cantidad' => 'decimal:4',
		'precio_unitario' => 'decimal:4',
		'total_linea' => 'decimal:4',
	];

	public function venta()
	{
		return $this->belongsTo(Venta::class, 'venta_id');
	}
}


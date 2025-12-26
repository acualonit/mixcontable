<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
	use HasFactory;

	protected $table = 'ventas';

	protected $fillable = [
		'fecha',
		'sucursal_id',
		'cliente_id',
		'sucursal_nombre',
		'documentoVenta',
		'folioVenta',
		'subtotal',
		'iva',
		'total',
		'metodos_pago',
		'metodos_pago_detalle',
		'observaciones',
		'estado',
	];

	protected $casts = [
		'fecha' => 'datetime',
		'subtotal' => 'decimal:2',
		'iva' => 'decimal:2',
		'total' => 'decimal:2',
		// `metodos_pago` en la tabla es un ENUM con literales; no castear a array
		// para evitar que Laravel JSON-encode valores que no coincidan con el ENUM.
	];

	public function detalles()
	{
		return $this->hasMany(VentaDetalle::class, 'venta_id');
	}

	public function cliente()
	{
		return $this->belongsTo(Cliente::class, 'cliente_id');
	}

	public function metodosPago()
	{
		return $this->hasOne(VentaMetodoPago::class, 'venta_id');
	}
}


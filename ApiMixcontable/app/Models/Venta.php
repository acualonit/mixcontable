<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venta extends Model
{
	use HasFactory;
	use SoftDeletes;

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

	protected static function booted()
	{
		static::deleting(function (self $venta) {
			if ($venta->isForceDeleting()) {
				$venta->detalles()->withTrashed()->forceDelete();
				return;
			}

			$venta->detalles()->delete();
		});

		static::restoring(function (self $venta) {
			$venta->detalles()->withTrashed()->restore();
		});
	}

	public function cliente()
	{
		return $this->belongsTo(Cliente::class, 'cliente_id');
	}

	public function sucursal()
	{
		return $this->belongsTo(Sucursal::class, 'sucursal_id');
	}

	public function metodosPago()
	{
		return $this->hasOne(VentaMetodoPago::class, 'venta_id');
	}
}


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
		'fecha_final', // agregado para permitir guardar fecha de vencimiento en ventas
	];

	protected $casts = [
		'fecha' => 'datetime',
		'subtotal' => 'decimal:2',
		'iva' => 'decimal:2',
		'total' => 'decimal:2',
		'fecha_final' => 'datetime', // castear fecha_final
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
		// Si existe la tabla `venta_metodos_pago` se podría retornar una relación.
		// Para evitar consultas a una tabla que puede no existir en entornos
		// sin migraciones, devolvemos null aquí y proporcionamos el accesor
		// `metodos_pago_detalle` que lee los detalles desde archivos en storage.
		return null;
	}

	/**
	 * Accesor para obtener los métodos de pago detallados (sin usar tabla DB).
	 * Lee el archivo storage/app/venta_metodos_pago/{venta_id}.json si existe.
	 */
	public function getMetodosPagoDetalleAttribute()
	{
		try {
			$file = storage_path('app/venta_metodos_pago') . DIRECTORY_SEPARATOR . ($this->id ?? 'unknown') . '.json';
			if (file_exists($file)) {
				$content = file_get_contents($file);
				$json = json_decode($content, true);
				return $json;
			}
		} catch (\Exception $e) {
			// No romper la aplicación si algo falla al leer el archivo
		}
		return null;
	}
}


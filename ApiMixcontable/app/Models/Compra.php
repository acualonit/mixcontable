<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compra extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'compras';

    protected $fillable = [
        'proveedor_id',
        'sucursal_id',
        'id_sucursal',
        'fecha',
        'tipo_documento',
        'folio',
        'total_neto',
        'total_impuesto',
        'total_bruto',
        'estado',
        'observaciones',
        'created_by',
        'created_by_name',
        'updated_by',
        'updated_by_name',
        'deleted_by',
        'deleted_by_name',
        'fecha_final',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_final' => 'date',
        'total_neto' => 'decimal:2',
        'total_impuesto' => 'decimal:2',
        'total_bruto' => 'decimal:2',
    ];

    public function detalles()
    {
        return $this->hasMany(CompraDetalle::class, 'compra_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'id_sucursal');
    }

    // Compatibilidad: exponer `sucursal_id` como alias de `id_sucursal`
    public function getSucursalIdAttribute()
    {
        return $this->attributes['id_sucursal'] ?? $this->attributes['sucursal_id'] ?? null;
    }

    public function setSucursalIdAttribute($value)
    {
        $this->attributes['id_sucursal'] = $value;
    }

    protected static function booted()
    {
        static::deleting(function (self $compra) {
            if ($compra->isForceDeleting()) {
                $compra->detalles()->withTrashed()->forceDelete();
                return;
            }
            $compra->detalles()->delete();
        });

        static::restoring(function (self $compra) {
            $compra->detalles()->withTrashed()->restore();
        });
    }
}

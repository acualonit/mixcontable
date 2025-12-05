<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Empresa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nombre',
        'rut',
        'direccion',
        'telefono',
        'email',
        'moneda',
        'iva',
        'logo_path',
    ];

    protected $appends = ['logo_url'];

    public function sucursales()
    {
        return $this->hasMany(Sucursal::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->logo_path);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cheque extends Model
{
    use SoftDeletes;

    protected $table = 'cheques';

    protected $fillable = [
        'cuenta_id',
        'id_sucursal',
        'numero_cheque',
        'fecha_emision',
        'fecha_cobro',
        'beneficiario',
        'concepto',
        'monto',
        'estado',
        'observaciones'
    ];

    protected $dates = ['fecha_emision', 'fecha_cobro', 'created_at', 'updated_at', 'deleted_at'];
}

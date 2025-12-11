<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Mirror provided SQL structure for proveedores table
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('rut', 20)->unique();
            $table->string('razon_social', 255);
            $table->string('nombre_comercial', 255)->nullable();
            $table->string('pagina_web', 255)->nullable();
            $table->string('direccion', 255);
            $table->string('comuna', 255);
            $table->string('region', 255);
            $table->string('ciudad', 255);
            $table->string('correo', 255);
            $table->string('correo_finanzas', 255)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('celular', 20)->nullable();
            $table->string('nombre_vendedor', 255)->nullable();
            $table->string('celular_vendedor', 20)->nullable();
            $table->string('correo_vendedor', 255)->nullable();
            $table->enum('metodo_pago', ['efectivo', 'cheque', 'transferencia'])->default('efectivo');
            $table->text('comentario')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable()->useCurrentOnUpdate()->useCurrent();
            $table->softDeletes();
            $table->index('region');
            $table->index('deleted_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('proveedores');
    }
};

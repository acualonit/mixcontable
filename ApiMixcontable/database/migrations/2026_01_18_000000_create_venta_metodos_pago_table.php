<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('venta_metodos_pago', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('venta_id')->index();
            // Guardamos el JSON de métodos aquí; usar text por compatibilidad
            $table->text('metodos')->nullable();
            $table->timestamps();

            // Intentar agregar foreign key si la tabla `ventas` existe y soporta claves foráneas
            try {
                $table->foreign('venta_id')->references('id')->on('ventas')->onDelete('cascade');
            } catch (\Throwable $e) {
                // En algunos entornos (tablas MyISAM, privilegios) la FK puede fallar; ignoramos para no romper la migración
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('venta_metodos_pago');
    }
};

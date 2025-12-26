<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ventas_detalle', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('venta_id');
            $table->unsignedBigInteger('producto_id')->nullable();
            $table->string('descripcion', 1000)->nullable();
            $table->decimal('cantidad', 18, 4)->default(1.0000);
            $table->decimal('precio_unitario', 15, 4)->default(0.0000);
            $table->decimal('total_linea', 18, 4)->default(0.0000);
            $table->timestamps();

            $table->index('venta_id');

            // FK commented out to prevent issues if ventas table not present at migration time
            // $table->foreign('venta_id')->references('id')->on('ventas')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ventas_detalle');
    }
};

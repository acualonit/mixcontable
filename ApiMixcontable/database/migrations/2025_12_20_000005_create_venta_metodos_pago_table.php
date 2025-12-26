<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasTable('venta_metodos_pago')) {
            Schema::create('venta_metodos_pago', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('venta_id')->index();
                $table->text('metodos')->nullable(); // guardaremos JSON serializado
                $table->timestamps();

                $table->foreign('venta_id')->references('id')->on('ventas')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('venta_metodos_pago');
    }
};

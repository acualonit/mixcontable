<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->unsignedBigInteger('sucursal_id')->nullable();
            $table->string('sucursal_nombre')->nullable();
            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->string('documentoVenta')->nullable();
            $table->string('folioVenta')->nullable();
            $table->decimal('subtotal', 18, 2)->default(0);
            $table->decimal('iva', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->default(0);
            $table->json('metodos_pago')->nullable();
            $table->text('observaciones')->nullable();
            $table->string('estado')->default('REGISTRADA');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('ventas');
    }
};

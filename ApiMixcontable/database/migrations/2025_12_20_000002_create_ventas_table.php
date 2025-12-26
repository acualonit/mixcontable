<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->dateTime('fecha');
            $table->unsignedBigInteger('sucursal_id')->nullable();
            $table->string('sucursal_nombre')->nullable();
            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->string('documentoVenta', 100)->nullable();
            $table->string('folioVenta', 100)->nullable();
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('iva', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2)->default(0.00);
            $table->json('metodos_pago')->nullable();
            $table->text('observaciones')->nullable();
            $table->string('estado', 50)->default('REGISTRADA');
            $table->timestamps();

            $table->index('cliente_id');
            $table->index('sucursal_id');

            // FK constraints commented to avoid migration failures if related tables not present
            // $table->foreign('cliente_id')->references('id')->on('clientes')->onDelete('set null');
            // $table->foreign('sucursal_id')->references('id')->on('sucursales')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ventas');
    }
};

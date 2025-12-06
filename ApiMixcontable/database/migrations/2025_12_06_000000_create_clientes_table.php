<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('rut')->nullable();
            $table->string('razon_social');
            $table->string('nombre_fantasia')->nullable();
            $table->string('giro')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('contacto_principal')->nullable();
            $table->string('telefono_principal')->nullable();
            $table->string('email_principal')->nullable();
            $table->string('condicion_venta')->default('0');
            $table->string('estado')->default('activo');
            $table->json('historial_estados')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};

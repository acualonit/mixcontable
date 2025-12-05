<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('respaldos', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['manual', 'automatico'])->default('manual');
            $table->string('archivo')->nullable();
            $table->string('ruta')->nullable();
            $table->enum('estado', ['PENDIENTE', 'COMPLETADO', 'FALLIDO'])->default('COMPLETADO');
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('detalles')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('respaldos');
    }
};

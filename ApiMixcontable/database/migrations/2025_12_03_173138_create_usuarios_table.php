<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migración deshabilitada: la tabla `usuarios` ya no se usa.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Sin acción
    }
};

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
        if (!Schema::hasTable('ventas')) return;

        // Hacer nullable la columna fecha_final para evitar error al insertar sin valor
        if (Schema::hasColumn('ventas', 'fecha_final')) {
            try {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->dateTime('fecha_final')->nullable()->change();
                });
            } catch (\Exception $e) {
                // Si no está disponible el método change (falta doctrine/dbal), registrar advertencia
                \Log::warning('No se pudo modificar columna fecha_final para que sea nullable: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('ventas')) return;

        if (Schema::hasColumn('ventas', 'fecha_final')) {
            try {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->dateTime('fecha_final')->nullable(false)->change();
                });
            } catch (\Exception $e) {
                \Log::warning('No se pudo revertir cambio de fecha_final: ' . $e->getMessage());
            }
        }
    }
};

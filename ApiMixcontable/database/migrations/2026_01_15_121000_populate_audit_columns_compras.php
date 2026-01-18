<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Usuario por defecto para asignar a registros existentes (puedes cambiar a otro id)
        $defaultUserId = 1;

        // Obtener nombre del usuario por defecto
        $defaultName = DB::table('users')->where('id', $defaultUserId)->value('name') ?: 'Usuario por defecto';

        // Solo proceder si la tabla y columnas existen
        if (!Schema::hasTable('compras')) return;

        $columns = [
            'created_by', 'created_by_name',
            'updated_by', 'updated_by_name',
            'deleted_by', 'deleted_by_name'
        ];

        foreach ($columns as $col) {
            if (!Schema::hasColumn('compras', $col)) {
                // Si alguna columna no existe, saltar (las migraciones previas deberían crear estas)
                // No hacemos nada aquí.
            }
        }

        // Actualizar registros que no tienen autor asignado
        DB::table('compras')->whereNull('created_by')->update([
            'created_by' => $defaultUserId,
            'created_by_name' => $defaultName,
        ]);

        DB::table('compras')->whereNull('updated_by')->update([
            'updated_by' => $defaultUserId,
            'updated_by_name' => $defaultName,
        ]);

        DB::table('compras')->whereNull('deleted_by')->update([
            'deleted_by' => $defaultUserId,
            'deleted_by_name' => $defaultName,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No revert automático: dejar campos como están.
    }
};

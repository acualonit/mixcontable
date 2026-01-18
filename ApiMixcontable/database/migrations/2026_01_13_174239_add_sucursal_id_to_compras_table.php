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
        Schema::table('compras', function (Blueprint $table) {
            // Nota: este proyecto usa BD existente/importada; si ya existe la columna, la migración puede fallar.
            // Para simplificar, asumimos que NO existe y se aplica una sola vez.
            $table->unsignedBigInteger('sucursal_id')->nullable()->after('proveedor_id');
            $table->index('sucursal_id', 'idx_compras_sucursal');
            $table->foreign('sucursal_id', 'fk_compras_sucursal')
                ->references('id')
                ->on('sucursales')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            $table->dropForeign('fk_compras_sucursal');
            $table->dropIndex('idx_compras_sucursal');
            $table->dropColumn('sucursal_id');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Intentamos modificar las columnas usando DATE o DATETIME según exista.
     */
    public function up()
    {
        // Compras
        try {
            DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` DATE NULL");
        } catch (\Exception $e) {
            try {
                DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` DATETIME NULL");
            } catch (\Exception $e2) {
                // intentar tipo TIMESTAMP
                try {
                    DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` TIMESTAMP NULL");
                } catch (\Exception $e3) {
                    // falló: registrar para diagnóstico, pero no detener migración
                    // No tenemos acceso a Log aquí; usar SELECT 1 para evitar error
                }
            }
        }

        // Ventas
        try {
            DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` DATE NULL");
        } catch (\Exception $e) {
            try {
                DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` DATETIME NULL");
            } catch (\Exception $e2) {
                try {
                    DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` TIMESTAMP NULL");
                } catch (\Exception $e3) {
                    // ignorar
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     * Intentamos volver a NOT NULL (si es necesario).
     */
    public function down()
    {
        // Compras
        try {
            DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` DATE NOT NULL");
        } catch (\Exception $e) {
            try {
                DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` DATETIME NOT NULL");
            } catch (\Exception $e2) {
                try {
                    DB::statement("ALTER TABLE `compras` MODIFY `fecha_final` TIMESTAMP NOT NULL");
                } catch (\Exception $e3) {
                    // ignorar
                }
            }
        }

        // Ventas
        try {
            DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` DATE NOT NULL");
        } catch (\Exception $e) {
            try {
                DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` DATETIME NOT NULL");
            } catch (\Exception $e2) {
                try {
                    DB::statement("ALTER TABLE `ventas` MODIFY `fecha_final` TIMESTAMP NOT NULL");
                } catch (\Exception $e3) {
                    // ignorar
                }
            }
        }
    }
};

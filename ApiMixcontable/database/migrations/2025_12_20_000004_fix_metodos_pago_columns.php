<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasTable('ventas')) {
            return;
        }

        // Intentamos convertir/modificar `metodos_pago` a JSON si es posible
        if (Schema::hasColumn('ventas', 'metodos_pago')) {
            try {
                DB::statement("ALTER TABLE `ventas` MODIFY COLUMN `metodos_pago` JSON NULL DEFAULT NULL;");
            } catch (\Exception $e) {
                // fallback: convertir a TEXT si JSON no está soportado
                try {
                    DB::statement("ALTER TABLE `ventas` MODIFY COLUMN `metodos_pago` TEXT NULL DEFAULT NULL;");
                } catch (\Exception $inner) {
                    // Si tampoco funciona, lo dejamos como estaba y lo registramos
                    logger()->warning('No se pudo alterar columna metodos_pago: ' . $inner->getMessage());
                }
            }
        } else {
            // Si no existe, crearla preferiblemente como JSON
            try {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->json('metodos_pago')->nullable()->default(null)->after('total');
                });
            } catch (\Exception $e) {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->text('metodos_pago')->nullable()->default(null)->after('total');
                });
            }
        }

        // Agregar columna metodos_pago_detalle si no existe
        if (!Schema::hasColumn('ventas', 'metodos_pago_detalle')) {
            try {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->json('metodos_pago_detalle')->nullable()->after('metodos_pago');
                });
            } catch (\Exception $e) {
                Schema::table('ventas', function (Blueprint $table) {
                    $table->text('metodos_pago_detalle')->nullable()->after('metodos_pago');
                });
            }
        }
    }

    public function down()
    {
        if (!Schema::hasTable('ventas')) {
            return;
        }

        if (Schema::hasColumn('ventas', 'metodos_pago_detalle')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->dropColumn('metodos_pago_detalle');
            });
        }

        // No revertimos `metodos_pago` para evitar pérdida de datos automática
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class RenameSaldoInicialToSaldoInCuentasBancarias extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('cuentas_bancarias')) return;

        // Si existe la columna antigua y no existe la nueva, intentar renombrar
        if (Schema::hasColumn('cuentas_bancarias', 'saldo_inicial') && !Schema::hasColumn('cuentas_bancarias', 'saldo')) {
            try {
                Schema::table('cuentas_bancarias', function (Blueprint $table) {
                    $table->renameColumn('saldo_inicial', 'saldo');
                });
            } catch (\Exception $ex) {
                // Fallback: usar SQL directo para MySQL o crear columna nueva y copiar datos
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'mysql') {
                    DB::statement("ALTER TABLE cuentas_bancarias CHANGE `saldo_inicial` `saldo` DECIMAL(18,2) NOT NULL DEFAULT 0");
                } else {
                    if (!Schema::hasColumn('cuentas_bancarias', 'saldo')) {
                        Schema::table('cuentas_bancarias', function (Blueprint $table) {
                            $table->decimal('saldo', 18, 2)->default(0);
                        });
                        DB::statement("UPDATE cuentas_bancarias SET saldo = COALESCE(saldo_inicial,0)");
                        Schema::table('cuentas_bancarias', function (Blueprint $table) {
                            $table->dropColumn('saldo_inicial');
                        });
                    }
                }
            }
        } elseif (!Schema::hasColumn('cuentas_bancarias', 'saldo') && Schema::hasColumn('cuentas_bancarias', 'saldo_inicial')) {
            // otro caso: crear columna saldo, copiar datos y borrar la antigua
            Schema::table('cuentas_bancarias', function (Blueprint $table) {
                $table->decimal('saldo', 18, 2)->default(0);
            });
            DB::statement("UPDATE cuentas_bancarias SET saldo = COALESCE(saldo_inicial,0)");
            Schema::table('cuentas_bancarias', function (Blueprint $table) {
                $table->dropColumn('saldo_inicial');
            });
        }
    }

    public function down()
    {
        if (!Schema::hasTable('cuentas_bancarias')) return;

        if (Schema::hasColumn('cuentas_bancarias', 'saldo') && !Schema::hasColumn('cuentas_bancarias', 'saldo_inicial')) {
            try {
                Schema::table('cuentas_bancarias', function (Blueprint $table) {
                    $table->renameColumn('saldo', 'saldo_inicial');
                });
            } catch (\Exception $ex) {
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'mysql') {
                    DB::statement("ALTER TABLE cuentas_bancarias CHANGE `saldo` `saldo_inicial` DECIMAL(18,2) NOT NULL DEFAULT 0");
                } else {
                    Schema::table('cuentas_bancarias', function (Blueprint $table) {
                        $table->decimal('saldo_inicial', 18, 2)->default(0);
                    });
                    DB::statement("UPDATE cuentas_bancarias SET saldo_inicial = COALESCE(saldo,0)");
                    Schema::table('cuentas_bancarias', function (Blueprint $table) {
                        $table->dropColumn('saldo');
                    });
                }
            }
        }
    }
}

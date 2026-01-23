<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade columna cheque_id a movimientos_banco si no existe.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('movimientos_banco')) return;

        Schema::table('movimientos_banco', function (Blueprint $table) {
            if (!Schema::hasColumn('movimientos_banco', 'cheque_id')) {
                // usar unsignedBigInteger para relacionar con cheques.id; nullable por compatibilidad
                $table->unsignedBigInteger('cheque_id')->nullable()->after('id')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('movimientos_banco')) return;

        Schema::table('movimientos_banco', function (Blueprint $table) {
            if (Schema::hasColumn('movimientos_banco', 'cheque_id')) {
                $table->dropColumn('cheque_id');
            }
        });
    }
};

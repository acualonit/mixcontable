<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ChangeMetodosPagoToJson extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Cambia la columna `metodos_pago` de ENUM a JSON para permitir almacenar arreglos
        // Usamos una sentencia raw para mayor compatibilidad en MySQL/MariaDB
        DB::statement("ALTER TABLE `ventas` MODIFY COLUMN `metodos_pago` JSON NULL DEFAULT NULL;");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revertir a ENUM con los valores canónicos
        DB::statement("ALTER TABLE `ventas` MODIFY COLUMN `metodos_pago` ENUM('Efectivo','Transferencia','Tarjeta Debito','Tarjeta Credito','Cheque','Pago Online','Credito (Deuda)') NOT NULL DEFAULT 'Efectivo';");
    }
}

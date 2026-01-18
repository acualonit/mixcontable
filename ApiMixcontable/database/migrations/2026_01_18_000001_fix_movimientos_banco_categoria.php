<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        // Requerimiento del proyecto: NO aplicar cambios de esquema por migraciones.
        // La corrección del ENUM/categoría se maneja en runtime desde el código.
        return;
    }

    public function down()
    {
        // No revertimos automáticamente para evitar pérdida de datos; dejar vacía la reversa.
    }
};

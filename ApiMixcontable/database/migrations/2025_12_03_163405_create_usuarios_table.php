<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Esta migración ya no crea tabla porque usaremos solo 'users'.
    }

    public function down(): void
    {
        // Sin acción
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes()->after('remember_token');
        });

        Schema::table('empresas', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('sucursales', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('empresas', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('sucursales', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

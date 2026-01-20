<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cheques', function (Blueprint $table) {
            if (!Schema::hasColumn('cheques', 'user_id')) {
                // Según UI/DB: bigint
                $table->unsignedBigInteger('user_id')->nullable()->after('cuenta_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cheques', function (Blueprint $table) {
            if (Schema::hasColumn('cheques', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }
};

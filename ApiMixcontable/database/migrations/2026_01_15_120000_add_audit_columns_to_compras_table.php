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
            if (!Schema::hasColumn('compras', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('estado');
            }
            if (!Schema::hasColumn('compras', 'created_by_name')) {
                $table->string('created_by_name')->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('compras', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by_name');
            }
            if (!Schema::hasColumn('compras', 'updated_by_name')) {
                $table->string('updated_by_name')->nullable()->after('updated_by');
            }
            if (!Schema::hasColumn('compras', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('updated_by_name');
            }
            if (!Schema::hasColumn('compras', 'deleted_by_name')) {
                $table->string('deleted_by_name')->nullable()->after('deleted_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            if (Schema::hasColumn('compras', 'deleted_by_name')) {
                $table->dropColumn('deleted_by_name');
            }
            if (Schema::hasColumn('compras', 'deleted_by')) {
                $table->dropColumn('deleted_by');
            }
            if (Schema::hasColumn('compras', 'updated_by_name')) {
                $table->dropColumn('updated_by_name');
            }
            if (Schema::hasColumn('compras', 'updated_by')) {
                $table->dropColumn('updated_by');
            }
            if (Schema::hasColumn('compras', 'created_by_name')) {
                $table->dropColumn('created_by_name');
            }
            if (Schema::hasColumn('compras', 'created_by')) {
                $table->dropColumn('created_by');
            }
        });
    }
};

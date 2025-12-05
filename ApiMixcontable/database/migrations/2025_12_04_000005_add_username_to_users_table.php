<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->after('name');
            }
        });

        DB::table('users')
            ->whereNull('username')
            ->orderBy('id')
            ->lazy()
            ->each(function ($user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => 'user' . $user->id]);
            });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                return;
            }

            $table->unique('username');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'username')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_username_unique');
            $table->dropColumn('username');
        });
    }
};

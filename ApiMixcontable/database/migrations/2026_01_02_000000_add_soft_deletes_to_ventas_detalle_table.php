<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	public function up(): void
	{
		if (!Schema::hasTable('ventas_detalle')) {
			return;
		}

		if (!Schema::hasColumn('ventas_detalle', 'deleted_at')) {
			Schema::table('ventas_detalle', function (Blueprint $table) {
				$table->softDeletes();
				$table->index('deleted_at');
			});
		}
	}

	public function down(): void
	{
		if (!Schema::hasTable('ventas_detalle')) {
			return;
		}

		if (Schema::hasColumn('ventas_detalle', 'deleted_at')) {
			Schema::table('ventas_detalle', function (Blueprint $table) {
				$table->dropIndex(['deleted_at']);
				$table->dropSoftDeletes();
			});
		}
	}
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('ventas_detalle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->onDelete('cascade');
            $table->string('descripcion')->nullable();
            $table->decimal('cantidad', 18, 4)->default(1);
            $table->decimal('precio_unitario', 18, 4)->default(0);
            $table->decimal('total_linea', 18, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('ventas_detalle');
    }
};

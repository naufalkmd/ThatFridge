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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('icon');
            $table->string('location')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->date('expiry_date')->nullable();
            $table->unsignedInteger('shelf_life_days')->nullable();
            $table->string('note')->nullable();
            $table->string('source')->nullable();
            $table->timestamps();

            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_history', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->index(['user_id', 'section_id']);
        });

        Schema::table('photo_scans', function (Blueprint $table) {
            $table->index(['user_id', 'section_id']);
        });
    }

    public function down(): void
    {
        Schema::table('chat_history', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'section_id']);
        });

        Schema::table('photo_scans', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'section_id']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_history', function (Blueprint $table) {
            $table->uuid('session_id')->nullable()->after('agent')->index();
        });

        // Backfill: existing messages predate the session concept entirely, so group each
        // user's pre-existing history into a single session rather than leaving it ungrouped
        // (which would make it invisible to the new session-list endpoint).
        DB::table('chat_history')
            ->select('user_id')
            ->distinct()
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->each(function ($userId) {
                DB::table('chat_history')
                    ->where('user_id', $userId)
                    ->update(['session_id' => (string) Str::uuid()]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_history', function (Blueprint $table) {
            $table->dropColumn('session_id');
        });
    }
};
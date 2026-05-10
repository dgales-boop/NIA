<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Supports EntryService::list() filtering by project_id with ORDER BY updated_at DESC.
 * Additive index only; keeps existing entries.project_id index from the original migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->index(['project_id', 'updated_at'], 'entries_project_id_updated_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->dropIndex('entries_project_id_updated_at_index');
        });
    }
};

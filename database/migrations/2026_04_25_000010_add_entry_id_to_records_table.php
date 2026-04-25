<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('records', function (Blueprint $table) {
            $table->foreignId('entry_id')->nullable()->after('template_id')->constrained()->cascadeOnDelete();
            $table->index('entry_id');
        });
    }

    public function down(): void
    {
        Schema::table('records', function (Blueprint $table) {
            $table->dropForeign(['entry_id']);
            $table->dropColumn('entry_id');
        });
    }
};

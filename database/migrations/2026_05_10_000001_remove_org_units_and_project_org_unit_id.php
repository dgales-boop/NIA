<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['org_unit_id']);
            $table->dropColumn('org_unit_id');
        });

        Schema::dropIfExists('org_units');
    }

    public function down(): void
    {
        Schema::create('org_units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('level_type');
            $table->foreignId('parent_id')->nullable()->constrained('org_units')->nullOnDelete();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('parent_id');
            $table->index('level_type');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('org_unit_id')->nullable()->after('description')->constrained('org_units')->cascadeOnDelete();
            $table->index('org_unit_id');
        });
    }
};

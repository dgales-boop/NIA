<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('level_type'); // 'region' or 'imo'
            $table->foreignId('parent_id')->nullable()->constrained('org_units')->nullOnDelete();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('parent_id');
            $table->index('level_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_units');
    }
};

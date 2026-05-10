<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('field_types');
    }

    public function down(): void
    {
        // Restoring field_types is not supported; re-run original migrations from a fresh DB if needed.
    }
};

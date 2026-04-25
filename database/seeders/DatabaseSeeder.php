<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            FieldTypeSeeder::class,
            OrgUnitSeeder::class,
        ]);

        if (! User::query()->where('email', 'admin@nia.gov.ph')->exists()) {
            User::factory()->create([
                'name' => 'Ms. Puti Dela Cruz',
                'email' => 'admin@nia.gov.ph',
                'password' => 'password',
                'role' => 'admin',
            ]);
        }

        if (! User::query()->where('email', 'encoder@nia.gov.ph')->exists()) {
            User::factory()->create([
                'name' => 'Ms. Jane Rose T. Dela Cruz',
                'email' => 'encoder@nia.gov.ph',
                'password' => 'password',
                'role' => 'encoder',
            ]);
        }
    }
}

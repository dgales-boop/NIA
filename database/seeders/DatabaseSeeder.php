<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed demo login accounts only (no projects, templates, or entries).
     * Re-running resets passwords to match below.
     */
    public function run(): void
    {
        $accounts = [
            ['email' => 'admin@nia.gov.ph', 'name' => 'Administrator', 'role' => 'admin'],
            ['email' => 'encoder@nia.gov.ph', 'name' => 'Encoder', 'role' => 'encoder'],
        ];

        foreach ($accounts as $account) {
            User::query()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => 'password',
                    'role' => $account['role'],
                ],
            );
        }
    }
}

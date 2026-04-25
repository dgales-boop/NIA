<?php

namespace Database\Seeders;

use App\Models\FieldType;
use Illuminate\Database\Seeder;

class FieldTypeSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            [
                'name' => 'Short Text',
                'key' => 'short_text',
                'base_type' => 'text',
                'settings' => ['placeholder' => 'Enter short text'],
                'validation_rules' => ['max' => 255],
                'is_active' => true,
            ],
            [
                'name' => 'Long Text',
                'key' => 'long_text',
                'base_type' => 'textarea',
                'settings' => ['placeholder' => 'Enter details'],
                'validation_rules' => ['max' => 5000],
                'is_active' => true,
            ],
            [
                'name' => 'Number',
                'key' => 'number',
                'base_type' => 'number',
                'settings' => null,
                'validation_rules' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Date',
                'key' => 'date',
                'base_type' => 'date',
                'settings' => ['format' => 'Y-m-d'],
                'validation_rules' => ['format' => 'Y-m-d'],
                'is_active' => true,
            ],
            [
                'name' => 'Yes/No',
                'key' => 'yes_no',
                'base_type' => 'boolean',
                'settings' => ['labels' => ['Yes', 'No']],
                'validation_rules' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Dropdown (Basic)',
                'key' => 'dropdown_basic',
                'base_type' => 'select',
                'settings' => ['options' => ['Option A', 'Option B']],
                'validation_rules' => ['in_settings_options' => true],
                'is_active' => true,
            ],
        ];

        foreach ($catalog as $fieldType) {
            FieldType::query()->updateOrCreate(
                ['key' => $fieldType['key']],
                $fieldType
            );
        }
    }
}

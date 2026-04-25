<?php

namespace App\Services\FieldTypes;

use App\Models\FieldType;
use Illuminate\Database\Eloquent\Collection;

class FieldTypeService
{
    public function create(array $payload): FieldType
    {
        return FieldType::query()->create([
            'name' => $payload['name'],
            'key' => $payload['key'],
            'base_type' => $payload['base_type'],
            'settings' => $payload['settings'] ?? null,
            'validation_rules' => $payload['validation_rules'] ?? null,
            'is_active' => $payload['is_active'] ?? true,
        ]);
    }

    public function listActive(): Collection
    {
        return FieldType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function listAll(): Collection
    {
        return FieldType::query()
            ->orderBy('name')
            ->get();
    }

    public function deactivate(FieldType $fieldType): FieldType
    {
        $fieldType->update([
            'is_active' => false,
        ]);

        return $fieldType->refresh();
    }
}

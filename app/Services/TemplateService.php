<?php

namespace App\Services;

use App\Models\FieldType;
use App\Models\Template;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TemplateService
{
    public function create(array $payload): Template
    {
        $fields = $payload['schema']['fields'] ?? [];
        $fieldTypeIds = collect($fields)->pluck('field_type_id')->unique()->values();

        $fieldTypes = FieldType::query()
            ->whereIn('id', $fieldTypeIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $normalizedFields = [];

        foreach ($fields as $field) {
            $fieldType = $fieldTypes->get($field['field_type_id']);

            if (! $fieldType) {
                throw ValidationException::withMessages([
                    'schema.fields' => ['Invalid or inactive field type reference found.'],
                ]);
            }

            $normalizedFields[] = [
                'key' => $field['key'],
                'label' => $field['label'],
                'required' => (bool) ($field['required'] ?? false),
                'field_type_id' => $fieldType->id,
                'field_type_name' => $fieldType->name,
                'field_type_key' => $fieldType->key,
                'base_type' => $fieldType->base_type,
                'settings' => $fieldType->settings,
            ];
        }

        return Template::query()->create([
            'name' => $payload['name'],
            'schema' => [
                'fields' => $normalizedFields,
            ],
        ]);
    }

    public function listSummaries(): Collection
    {
        return Template::query()
            ->select(['id', 'name', 'schema'])
            ->orderBy('id')
            ->get();
    }
}

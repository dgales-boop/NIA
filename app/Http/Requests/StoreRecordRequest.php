<?php

namespace App\Http\Requests;

use App\Models\Template;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'entry_id' => ['nullable', 'integer', 'exists:entries,id'],
            'data' => ['required', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $templateId = $this->input('template_id');

            if (! $templateId) {
                return;
            }

            $template = Template::query()->find($templateId);

            if (! $template) {
                return;
            }

            $schemaFields = collect($template->schema['fields'] ?? []);
            $schemaKeys = $schemaFields->pluck('key')->all();
            $data = $this->input('data', []);
            $dataKeys = array_keys($data);

            $unknownKeys = array_diff($dataKeys, $schemaKeys);

            if (! empty($unknownKeys)) {
                $validator->errors()->add('data', 'Unknown fields are not allowed: '.implode(', ', $unknownKeys));
            }

            foreach ($schemaFields as $field) {
                $key = $field['key'] ?? null;

                if (! $key) {
                    continue;
                }

                $value = $data[$key] ?? null;
                $isRequired = (bool) ($field['required'] ?? false);

                if ($isRequired && $this->isEmptyValue($value)) {
                    $validator->errors()->add('data.'.$key, 'This field is required.');
                    continue;
                }

                if ($this->isEmptyValue($value)) {
                    continue;
                }

                $baseType = $field['base_type'] ?? 'text';

                if (! $this->isValidByBaseType($value, $baseType, $field)) {
                    $validator->errors()->add('data.'.$key, 'The value does not match required type: '.$baseType.'.');
                }
            }
        });
    }

    private function isEmptyValue(mixed $value): bool
    {
        return $value === null || $value === '';
    }

    private function isValidByBaseType(mixed $value, string $baseType, array $field): bool
    {
        return match ($baseType) {
            'number' => is_numeric($value),
            'date' => is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1,
            'boolean' => in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false', 'yes', 'no'], true),
            'select' => $this->isValidSelectValue($value, $field),
            default => is_scalar($value),
        };
    }

    private function isValidSelectValue(mixed $value, array $field): bool
    {
        if (! is_scalar($value)) {
            return false;
        }

        $options = $field['settings']['options'] ?? [];

        if (! is_array($options) || empty($options)) {
            return true;
        }

        return in_array((string) $value, array_map('strval', $options), true);
    }
}

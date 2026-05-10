<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'schema' => ['sometimes', 'required', 'array'],
            'schema.fields' => ['required_with:schema', 'array', 'min:1'],
            'schema.fields.*.key' => ['required_with:schema.fields', 'string'],
            'schema.fields.*.label' => ['required_with:schema.fields', 'string'],
            'schema.fields.*.required' => ['sometimes', 'boolean'],
            'schema.fields.*.base_type' => ['required_with:schema.fields', 'string', Rule::in(['text', 'number', 'date', 'boolean'])],
            'schema.fields.*.max' => ['sometimes', 'nullable', 'integer', 'min:'.StoreTemplateRequest::TEXT_MAX_MIN, 'max:'.StoreTemplateRequest::TEXT_MAX_CAP],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('schema')) {
                return;
            }

            $fields = $this->input('schema.fields', []);

            $keys = collect($fields)
                ->pluck('key')
                ->filter(static fn ($value) => $value !== null && $value !== '')
                ->values();

            if ($keys->count() !== $keys->unique()->count()) {
                $validator->errors()->add('schema.fields', 'Duplicate field keys are not allowed.');
            }

            foreach ($fields as $index => $field) {
                $baseType = $field['base_type'] ?? null;
                if ($baseType !== 'text' && array_key_exists('max', $field) && $field['max'] !== null && $field['max'] !== '') {
                    $validator->errors()->add(
                        "schema.fields.{$index}.max",
                        'Max length may only be set for text columns.',
                    );
                }
            }
        });
    }
}

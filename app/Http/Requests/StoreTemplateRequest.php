<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'schema' => ['required', 'array'],
            'schema.fields' => ['required', 'array', 'min:1'],
            'schema.fields.*.key' => ['required', 'string'],
            'schema.fields.*.label' => ['required', 'string'],
            'schema.fields.*.required' => ['sometimes', 'boolean'],
            'schema.fields.*.field_type_id' => [
                'required',
                'integer',
                Rule::exists('field_types', 'id')->where(static fn ($query) => $query->where('is_active', true)),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $fields = $this->input('schema.fields', []);

            $keys = collect($fields)
                ->pluck('key')
                ->filter(static fn ($value) => $value !== null && $value !== '')
                ->values();

            if ($keys->count() !== $keys->unique()->count()) {
                $validator->errors()->add('schema.fields', 'Duplicate field keys are not allowed.');
            }
        });
    }
}

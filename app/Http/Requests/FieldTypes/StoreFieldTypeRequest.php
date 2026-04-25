<?php

namespace App\Http\Requests\FieldTypes;

use Illuminate\Foundation\Http\FormRequest;

class StoreFieldTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'key' => ['required', 'string', 'max:255', 'unique:field_types,key'],
            'base_type' => ['required', 'in:text,number,date,select,boolean,textarea'],
            'settings' => ['nullable', 'array'],
            'validation_rules' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

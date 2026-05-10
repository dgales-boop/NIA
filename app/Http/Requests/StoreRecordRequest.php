<?php

namespace App\Http\Requests;

use App\Models\Entry;
use App\Models\Template;
use App\Support\RecordSchemaValidator;
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
            $templateId = (int) $this->input('template_id');

            if (! $templateId) {
                return;
            }

            $template = Template::query()->find($templateId);

            if (! $template) {
                return;
            }

            $entryId = $this->input('entry_id');

            if ($entryId) {
                $entry = Entry::query()->find((int) $entryId);

                if ($entry && (int) $entry->template_id !== $templateId) {
                    $validator->errors()->add('entry_id', 'The entry does not use this template.');
                }

                if ($entry && $entry->status !== 'open') {
                    $validator->errors()->add('entry_id', 'Records can only be saved while the entry is open.');
                }
            }

            RecordSchemaValidator::validateDataArray(
                $template,
                $this->input('data', []),
                $validator,
                'data',
            );
        });
    }
}

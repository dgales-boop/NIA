<?php

namespace App\Http\Requests;

use App\Models\Entry;
use App\Models\Template;
use App\Support\RecordSchemaValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class BulkStoreRecordsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'entry_id' => ['required', 'integer', 'exists:entries,id'],
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*' => ['required', 'array'],
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

            $entryId = (int) $this->input('entry_id');
            $entry = Entry::query()->find($entryId);

            if ($entry && (int) $entry->template_id !== $templateId) {
                $validator->errors()->add('entry_id', 'The entry does not use this template.');
            }

            if ($entry && $entry->status !== 'open') {
                $validator->errors()->add('entry_id', 'Records can only be saved while the entry is open.');
            }

            $rows = $this->input('rows', []);

            if (! is_array($rows)) {
                return;
            }

            foreach ($rows as $index => $row) {
                if (! is_array($row)) {
                    $validator->errors()->add('rows.'.$index, 'Each row must be an object of field values.');

                    continue;
                }

                RecordSchemaValidator::validateDataArray(
                    $template,
                    $row,
                    $validator,
                    'rows.'.$index,
                );
            }
        });
    }
}

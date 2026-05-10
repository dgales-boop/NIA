<?php

namespace App\Http\Requests;

use App\Models\Entry;
use App\Models\Record;
use App\Models\Template;
use App\Support\RecordSchemaValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('record');

        if (! $record instanceof Record) {
            return false;
        }

        if (! $record->entry_id) {
            return false;
        }

        $entry = Entry::query()->find($record->entry_id);

        if (! $entry || $entry->status !== 'open') {
            return false;
        }

        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return (int) $entry->created_by === (int) $user->id;
    }

    public function rules(): array
    {
        return [
            'data' => ['required', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $record = $this->route('record');

            if (! $record instanceof Record) {
                return;
            }

            $template = Template::query()->find($record->template_id);

            if (! $template) {
                return;
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

<?php

namespace App\Services;

use App\Models\Record;
use App\Models\Template;
use Illuminate\Database\Eloquent\Collection;

class RecordService
{
    public function create(array $payload): Record
    {
        $template = Template::query()->findOrFail($payload['template_id']);
        $schemaKeys = collect($template->schema['fields'] ?? [])->pluck('key')->all();

        $normalizedData = [];

        foreach ($schemaKeys as $key) {
            $normalizedData[$key] = $payload['data'][$key] ?? null;
        }

        return Record::query()->create([
            'template_id' => $template->id,
            'entry_id' => $payload['entry_id'] ?? null,
            'data' => $normalizedData,
        ]);
    }

    public function listByTemplate(int $templateId): Collection
    {
        return Record::query()
            ->where('template_id', $templateId)
            ->select(['id', 'data', 'entry_id'])
            ->orderBy('id')
            ->get();
    }

    public function listByEntry(int $entryId): Collection
    {
        return Record::query()
            ->where('entry_id', $entryId)
            ->select(['id', 'data', 'template_id'])
            ->orderBy('id')
            ->get();
    }
}

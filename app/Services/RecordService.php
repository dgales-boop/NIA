<?php

namespace App\Services;

use App\Models\Record;
use App\Models\Template;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

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

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, Record>
     */
    public function createMany(int $templateId, int $entryId, array $rows): array
    {
        return DB::transaction(function () use ($templateId, $entryId, $rows): array {
            $template = Template::query()->findOrFail($templateId);
            $schemaKeys = collect($template->schema['fields'] ?? [])->pluck('key')->all();

            if ($rows === []) {
                return [];
            }

            $now = now();
            $maxBefore = (int) Record::query()->where('entry_id', $entryId)->max('id');

            $batch = [];

            foreach ($rows as $row) {
                $normalizedData = [];
                $rowArray = is_array($row) ? $row : [];

                foreach ($schemaKeys as $key) {
                    $normalizedData[$key] = $rowArray[$key] ?? null;
                }

                $batch[] = [
                    'template_id' => $templateId,
                    'entry_id' => $entryId,
                    'data' => json_encode($normalizedData),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            Record::query()->insert($batch);

            return Record::query()
                ->where('entry_id', $entryId)
                ->where('template_id', $templateId)
                ->where('id', '>', $maxBefore)
                ->orderBy('id')
                ->get()
                ->all();
        });
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

    /**
     * @param  array<string, mixed>  $dataPayload
     */
    public function update(int $id, array $dataPayload): Record
    {
        $record = Record::query()->findOrFail($id);
        $template = Template::query()->findOrFail($record->template_id);
        $schemaKeys = collect($template->schema['fields'] ?? [])->pluck('key')->all();

        $normalizedData = [];
        foreach ($schemaKeys as $key) {
            $normalizedData[$key] = $dataPayload[$key] ?? null;
        }

        $record->data = $normalizedData;
        $record->save();

        return $record->fresh();
    }
}

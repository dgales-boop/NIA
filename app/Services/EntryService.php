<?php

namespace App\Services;

use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;

class EntryService
{
    public function list(?int $projectId = null, ?string $status = null): Collection
    {
        $query = Entry::query()
            ->with([
                'project:id,name',
                'project.orgUnit:id,name,code',
                'template:id,name',
                'createdBy:id,name',
            ])
            ->withCount('records');

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('updated_at')->get();
    }

    public function create(array $payload): Entry
    {
        $entry = Entry::query()->create($payload);

        return $entry->load([
            'project:id,name',
            'template:id,name',
            'createdBy:id,name',
        ]);
    }

    public function find(int $id): Entry
    {
        return Entry::query()
            ->with([
                'project:id,name',
                'project.orgUnit:id,name,code',
                'template',
                'records',
                'createdBy:id,name',
            ])
            ->findOrFail($id);
    }

    public function close(int $id): Entry
    {
        $entry = Entry::query()->findOrFail($id);
        $entry->update(['status' => 'closed']);

        return $entry->fresh();
    }

    public function reopen(int $id): Entry
    {
        $entry = Entry::query()->findOrFail($id);
        $entry->update(['status' => 'open']);

        return $entry->fresh();
    }
}

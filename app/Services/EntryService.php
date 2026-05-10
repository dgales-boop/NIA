<?php

namespace App\Services;

use App\Models\Entry;
use App\Models\User;
use App\Support\LikePattern;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class EntryService
{
    public function listPaginated(
        ?int $projectId = null,
        ?string $status = null,
        ?string $search = null,
        int $perPage = 15,
        ?int $page = null,
    ): LengthAwarePaginator {
        $query = Entry::query()
            ->with([
                'project:id,name',
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

        $pattern = LikePattern::contains($search);
        if ($pattern !== null) {
            $query->where(function ($q) use ($pattern) {
                $q->where('title', 'like', $pattern)
                    ->orWhereHas('project', static fn ($q) => $q->where('name', 'like', $pattern))
                    ->orWhereHas('template', static fn ($q) => $q->where('name', 'like', $pattern));
            });
        }

        return $query->orderByDesc('updated_at')->paginate($perPage, ['*'], 'page', $page)->withQueryString();
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
                'template' => static fn ($q) => $q->select(['id', 'name', 'schema']),
                'records' => static fn ($q) => $q
                    ->select(['id', 'entry_id', 'template_id', 'data'])
                    ->orderBy('id'),
                'createdBy:id,name',
            ])
            ->findOrFail($id);
    }

    public function close(int $id): Entry
    {
        $entry = Entry::query()->findOrFail($id);

        if ($entry->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => ['Only an open entry can be closed.'],
            ]);
        }

        $entry->update(['status' => 'closed']);

        return $entry->fresh();
    }

    public function reopen(int $id): Entry
    {
        $entry = Entry::query()->findOrFail($id);

        if ($entry->status === 'open') {
            throw ValidationException::withMessages([
                'status' => ['Entry is already open.'],
            ]);
        }

        if (! in_array($entry->status, ['closed', 'exported'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Entry cannot be reopened from its current state.'],
            ]);
        }

        $entry->update(['status' => 'open']);

        return $entry->fresh();
    }

    public function markExported(int $id): Entry
    {
        $entry = Entry::query()->findOrFail($id);

        $loaded = [
            'project:id,name',
            'template:id,name',
            'createdBy:id,name',
        ];

        if ($entry->status === 'exported') {
            return $entry->fresh()->load($loaded);
        }

        $entry->update(['status' => 'exported']);

        return $entry->fresh()->load($loaded);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(int $id, array $payload, User $user): Entry
    {
        $entry = Entry::query()->withCount('records')->findOrFail($id);

        if ($user->role !== 'admin') {
            $entry->update([
                'title' => $payload['title'],
            ]);

            return $entry->fresh()->load([
                'project:id,name',
                'template:id,name',
                'createdBy:id,name',
            ]);
        }

        $updates = [
            'title' => $payload['title'],
        ];

        if (array_key_exists('project_id', $payload)) {
            $updates['project_id'] = (int) $payload['project_id'];
        }

        if (array_key_exists('template_id', $payload)) {
            $newTemplateId = (int) $payload['template_id'];
            if ($newTemplateId !== (int) $entry->template_id && $entry->records_count > 0) {
                throw ValidationException::withMessages([
                    'template_id' => ['Cannot change the template while this entry has saved data rows.'],
                ]);
            }
            $updates['template_id'] = $newTemplateId;
        }

        $entry->update($updates);

        return $entry->fresh()->load([
            'project:id,name',
            'template:id,name',
            'createdBy:id,name',
        ]);
    }

    public function destroy(int $id): void
    {
        Entry::query()->whereKey($id)->delete();
    }
}

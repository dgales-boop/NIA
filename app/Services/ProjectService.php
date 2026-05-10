<?php

namespace App\Services;

use App\Models\Project;
use App\Support\LikePattern;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    public function listPaginated(?string $search, int $perPage, ?int $page = null): LengthAwarePaginator
    {
        $query = Project::query()
            ->with(['createdBy:id,name'])
            ->withCount('entries')
            ->orderByDesc('updated_at');

        $pattern = LikePattern::contains($search);
        if ($pattern !== null) {
            $query->where(function ($q) use ($pattern) {
                $q->where('name', 'like', $pattern)
                    ->orWhere('description', 'like', $pattern);
            });
        }

        return $query->paginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    /**
     * Lightweight list for entry modals (not paginated; capped).
     *
     * @return Collection<int, Project>
     */
    public function listForDropdown(): Collection
    {
        return Project::query()
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'name']);
    }

    public function create(array $payload): Project
    {
        return Project::query()->create($payload);
    }

    public function find(int $id): Project
    {
        return Project::query()
            ->with(['entries.template:id,name', 'createdBy:id,name'])
            ->withCount('entries')
            ->findOrFail($id);
    }

    public function update(int $id, array $payload): Project
    {
        $project = Project::query()->findOrFail($id);
        $project->fill([
            'name' => $payload['name'] ?? $project->name,
            'description' => array_key_exists('description', $payload)
                ? $payload['description']
                : $project->description,
        ]);
        $project->save();

        return $project->fresh()->load(['createdBy:id,name'])->loadCount('entries');
    }

    public function destroy(int $id): void
    {
        $project = Project::query()->withCount('entries')->findOrFail($id);

        if ($project->entries_count > 0) {
            throw ValidationException::withMessages([
                'project' => ['Cannot delete a project that still has budget entries.'],
            ]);
        }

        $project->delete();
    }
}

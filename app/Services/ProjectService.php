<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    public function list(?int $orgUnitId = null): Collection
    {
        $query = Project::query()
            ->with(['orgUnit:id,name,code', 'createdBy:id,name'])
            ->withCount('entries');

        if ($orgUnitId) {
            $query->where('org_unit_id', $orgUnitId);
        }

        return $query->orderByDesc('updated_at')->get();
    }

    public function create(array $payload): Project
    {
        return Project::query()->create($payload);
    }

    public function find(int $id): Project
    {
        return Project::query()
            ->with(['orgUnit:id,name,code', 'entries.template:id,name', 'createdBy:id,name'])
            ->withCount('entries')
            ->findOrFail($id);
    }
}

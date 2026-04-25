<?php

namespace App\Services;

use App\Models\OrgUnit;
use Illuminate\Support\Facades\Cache;

class OrgUnitService
{
    private const CACHE_TTL = 600;

    /**
     * Full tree: roots with nested children (used for initial org browser).
     */
    public function listTree(): array
    {
        return Cache::remember('org_units.tree', self::CACHE_TTL, function () {
            return OrgUnit::query()
                ->roots()
                ->with(['children' => function ($query) {
                    $query->withCount(['projects', 'children'])->orderBy('name')
                        ->with(['children' => function ($sq) {
                            $sq->withCount(['projects', 'children'])->orderBy('name');
                        }]);
                }])
                ->withCount(['projects', 'children'])
                ->orderBy('name')
                ->get()
                ->map(function ($unit) {
                    $unitArr = $unit->toArray();
                    $unitArr['projects_count'] = $unit->projects_count;
                    $unitArr['children_count'] = $unit->children_count;
                    if ($unit->relationLoaded('children')) {
                        $unitArr['children'] = $unit->children->map(function ($child) {
                            $c = $child->toArray();
                            $c['projects_count'] = $child->projects_count;
                            $c['children_count'] = $child->children_count;
                            if ($child->relationLoaded('children')) {
                                $c['children'] = $child->children->map(function ($sub) {
                                    $s = $sub->toArray();
                                    $s['projects_count'] = $sub->projects_count;
                                    $s['children_count'] = $sub->children_count;
                                    return $s;
                                })->all();
                            }
                            return $c;
                        })->all();
                    }
                    return $unitArr;
                })
                ->all();
        });
    }

    /**
     * Flat list of all org units with path info for dropdowns.
     */
    public function listAll(): array
    {
        return Cache::remember('org_units.flat', self::CACHE_TTL, function () {
            $units = OrgUnit::query()
                ->with('parent.parent') // up to 3 levels of ancestors
                ->orderBy('name')
                ->get();

            return $units->map(function (OrgUnit $unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'code' => $unit->code,
                    'level_type' => $unit->level_type,
                    'parent_id' => $unit->parent_id,
                    'path' => $unit->path,
                ];
            })->all();
        });
    }

    /**
     * Direct children of a specific org unit.
     */
    public function listChildren(int $parentId): array
    {
        $parent = OrgUnit::query()->findOrFail($parentId);

        $children = OrgUnit::query()
            ->where('parent_id', $parentId)
            ->withCount(['projects', 'children'])
            ->orderBy('name')
            ->get();

        return [
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->name,
                'code' => $parent->code,
                'level_type' => $parent->level_type,
                'ancestors' => $parent->ancestors,
            ],
            'children' => $children,
        ];
    }

    public function create(array $payload): OrgUnit
    {
        Cache::forget('org_units.tree');
        Cache::forget('org_units.flat');

        return OrgUnit::query()->create($payload);
    }

    public function find(int $id): OrgUnit
    {
        return OrgUnit::query()
            ->with(['children.projects', 'projects'])
            ->findOrFail($id);
    }
}

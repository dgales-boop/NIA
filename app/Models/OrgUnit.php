<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrgUnit extends Model
{
    protected $fillable = [
        'name',
        'code',
        'level_type',
        'parent_id',
        'description',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(OrgUnit::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(OrgUnit::class, 'parent_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    // ── Scopes ────────────────────────────────────────

    public function scopeRegions($query)
    {
        return $query->where('level_type', 'region');
    }

    public function scopeImos($query)
    {
        return $query->where('level_type', 'imo');
    }

    public function scopeSections($query)
    {
        return $query->where('level_type', 'section');
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    // ── Helpers ───────────────────────────────────────

    /**
     * Build ancestor chain from root to this unit.
     * Returns an array of compact objects: [{id, name, code, level_type}]
     */
    public function getAncestorsAttribute(): array
    {
        $ancestors = [];
        $current = $this->parent;

        while ($current) {
            array_unshift($ancestors, [
                'id' => $current->id,
                'name' => $current->name,
                'code' => $current->code,
                'level_type' => $current->level_type,
            ]);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * Full path string: "Region XIII > IMO SDN > Section"
     */
    public function getPathAttribute(): string
    {
        $parts = array_map(fn ($a) => $a['name'], $this->ancestors);
        $parts[] = $this->name;

        return implode(' > ', $parts);
    }
}

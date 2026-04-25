<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'schema',
    ];

    protected function casts(): array
    {
        return [
            'schema' => 'array',
        ];
    }

    public function records(): HasMany
    {
        return $this->hasMany(Record::class);
    }
}

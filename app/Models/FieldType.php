<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FieldType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'key',
        'base_type',
        'settings',
        'validation_rules',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'validation_rules' => 'array',
            'is_active' => 'boolean',
        ];
    }
}

<?php

namespace App\Support;

final class LikePattern
{
    /**
     * SQL LIKE pattern for substring match, with % and _ escaped. Returns null when empty.
     */
    public static function contains(?string $term): ?string
    {
        if ($term === null) {
            return null;
        }

        $t = trim($term);
        if ($t === '') {
            return null;
        }

        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $t);

        return '%'.$escaped.'%';
    }
}

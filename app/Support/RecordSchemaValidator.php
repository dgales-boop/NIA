<?php

namespace App\Support;

use App\Http\Requests\StoreTemplateRequest;
use App\Models\Template;
use Illuminate\Validation\Validator;

/**
 * Validates record "data" payloads (flat key => value) against a template schema.
 * Used by single-record and bulk-record FormRequests.
 */
final class RecordSchemaValidator
{
    public static function validateDataArray(
        Template $template,
        array $data,
        Validator $validator,
        string $errorKeyPrefix,
    ): void {
        $schemaFields = collect($template->schema['fields'] ?? []);
        $schemaKeys = $schemaFields->pluck('key')->all();
        $dataKeys = array_keys($data);

        $unknownKeys = array_diff($dataKeys, $schemaKeys);

        if (! empty($unknownKeys)) {
            $validator->errors()->add(
                $errorKeyPrefix,
                'Unknown fields are not allowed: '.implode(', ', $unknownKeys),
            );
        }

        foreach ($schemaFields as $field) {
            $key = $field['key'] ?? null;

            if (! $key) {
                continue;
            }

            $value = $data[$key] ?? null;
            $isRequired = (bool) ($field['required'] ?? false);

            if ($isRequired && self::isEmptyValue($value)) {
                $validator->errors()->add($errorKeyPrefix.'.'.$key, 'This field is required.');

                continue;
            }

            if (self::isEmptyValue($value)) {
                continue;
            }

            $baseType = $field['base_type'] ?? 'text';

            if (! self::isValidByBaseType($value, $baseType, $field)) {
                $validator->errors()->add(
                    $errorKeyPrefix.'.'.$key,
                    'The value does not match required type: '.$baseType.'.',
                );
            }
        }
    }

    public static function isEmptyValue(mixed $value): bool
    {
        return $value === null || $value === '';
    }

    public static function effectiveTextMax(array $field): int
    {
        $baseType = $field['base_type'] ?? 'text';

        if ($baseType === 'textarea') {
            return max(
                StoreTemplateRequest::TEXT_MAX_MIN,
                min(
                    StoreTemplateRequest::TEXT_MAX_CAP,
                    (int) ($field['max'] ?? 5000),
                ),
            );
        }

        return max(
            StoreTemplateRequest::TEXT_MAX_MIN,
            min(
                StoreTemplateRequest::TEXT_MAX_CAP,
                (int) ($field['max'] ?? StoreTemplateRequest::TEXT_MAX_DEFAULT),
            ),
        );
    }

    public static function isValidByBaseType(mixed $value, string $baseType, array $field): bool
    {
        return match ($baseType) {
            'number' => is_numeric($value),
            'date' => is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1,
            'boolean' => in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false', 'yes', 'no'], true),
            'textarea' => self::isValidTextValue($value, $field),
            'select' => self::isValidSelectValue($value, $field),
            'text' => self::isValidTextValue($value, $field),
            default => is_scalar($value),
        };
    }

    public static function isValidTextValue(mixed $value, array $field): bool
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return false;
        }

        $stringValue = (string) $value;
        $max = self::effectiveTextMax($field);

        return mb_strlen($stringValue) <= $max;
    }

    public static function isValidSelectValue(mixed $value, array $field): bool
    {
        if (! is_scalar($value)) {
            return false;
        }

        $options = $field['settings']['options'] ?? [];

        if (! is_array($options) || empty($options)) {
            return true;
        }

        return in_array((string) $value, array_map('strval', $options), true);
    }
}

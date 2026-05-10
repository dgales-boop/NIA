# Testing Strategy

## Critical Feature Tests

See `tests/Feature/TemplateRecordFlowTest.php` for the current gate:

1. Template creation with `base_type` columns (`text`, `number`, `date`, `boolean`) and optional text `max`.
2. Rejection of invalid `base_type` and of `max` on non-text columns.
3. Record creation validation: required fields, unknown keys, text length vs `max`, `entry_id` / `template_id` consistency.
4. Template schema updates blocked when records exist; name updates still allowed.
5. Entry update rules (encoder title-only + prohibited extra fields; non-owner forbidden).
6. Project delete blocked when entries exist.

## Build Gate

- `npm run build` passes
- `php artisan test` passes

## Regression Rule

Any change to request validation requires matching feature tests.

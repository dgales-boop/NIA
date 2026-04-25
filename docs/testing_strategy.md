# Testing Strategy

## Critical Feature Tests

1. Field type creation/listing.
2. Template creation with valid field_type_id.
3. Template creation rejection for inactive/invalid field type.
4. Record creation success with valid required fields.
5. Record creation rejection for missing required fields.
6. Record creation rejection for unknown keys.

## Build Gate

- npm run build passes
- php artisan test passes

## Regression Rule

Any change to request validation requires matching feature tests.

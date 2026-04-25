# Field Type Library Specification

## Objective

Provide a controlled, reusable library of field types managed by Admin users.

## Field Type Entity

- id
- name (human-readable)
- key (unique system key)
- base_type (text, number, date, select, boolean, textarea)
- settings (json)
- validation_rules (json)
- is_active (boolean)
- created_by (nullable)
- updated_by (nullable)
- timestamps

## Governance

1. Only Admin can create/update/deactivate field types.
2. key is immutable after creation.
3. Deactivated field types cannot be used in new templates.
4. Field types already used by templates are non-destructive:
    - safe edit allowed: name, description/help metadata
    - breaking edits disallowed in this phase

## Starter Catalog v1

1. short_text
    - base_type: text
    - description: Single-line text input
    - example: Pump Station A
2. long_text
    - base_type: textarea
    - description: Multi-line notes
    - example: Canal clearing completed today.
3. number
    - base_type: number
    - description: Numeric input
    - example: 125
4. date
    - base_type: date
    - description: Calendar date input
    - example: 2026-04-24
5. yes_no
    - base_type: boolean
    - description: Yes or No value
    - example: Yes
6. dropdown_basic
    - base_type: select
    - description: Choose from predefined options
    - example: Option A

## Template Contract

Each template field must reference an active field_type_id and store snapshots:

- field_type_id
- field_type_key
- base_type

## Record Validation Contract

For each template field:

- required field must be present and non-empty
- value must match base_type
- unknown keys rejected

## Compatibility

Existing templates that currently use text type should map to short_text during migration/seeding.

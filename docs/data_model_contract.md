# Data Model Contract

## projects

- id
- name
- description (nullable)
- created_by (user id)
- timestamps

## entries

- id
- title
- project_id
- template_id
- status (`open` | `closed` | `exported`)
- created_by
- timestamps

## templates

- id
- name
- schema (json)
- timestamps

### Schema field object (current)

- `key` (string)
- `label` (string)
- `required` (boolean)
- `base_type`: `text` | `number` | `date` | `boolean`
- `max` (integer, **text only**): optional; default 2000 when omitted on save; clamped between 255 and 10000

Legacy rows may still contain older keys (`field_type_id`, `textarea`, `select`, etc.); readers should prefer `base_type` and treat unknown types conservatively.

## records

- id
- template_id
- entry_id (nullable, FK; cascade on entry delete)
- data (json)
- timestamps

Rules:

- `data` keys must exist in the template schema keys
- Required fields must be present (non-empty)
- Optional fields may be omitted or null
- When `entry_id` is set, it must reference an entry whose `template_id` equals the record’s `template_id`
- When `entry_id` is set, the entry must be **`open`** (new records are not accepted for `closed` or `exported` entries)

## Column types

See `docs/field_type_library_spec.md` (renamed concept: fixed four column types, no separate field-type catalog table).

## Immutability

- Template **column definitions** (`schema`) cannot change once any **record** exists for that `template_id`.
- Template **name** can still be updated.
- Entry **template_id** cannot change once the entry has **records**.

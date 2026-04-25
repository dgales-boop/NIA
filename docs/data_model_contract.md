# Data Model Contract

## templates

- id
- name
- schema (json)
- timestamps

Schema field object:

- key
- label
- required (boolean)
- field_type_id
- field_type_key (snapshot)
- base_type (snapshot)

## records

- id
- template_id
- data (json)
- timestamps

Rules:

- data keys must exist in template schema keys
- required fields must be present
- missing optional fields allowed as null

## field_types

Defined in docs/field_type_library_spec.md.

## Immutability

- Template structure locked once records exist.
- Existing records always interpretable via template snapshots.

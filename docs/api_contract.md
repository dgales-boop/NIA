# API Contract (Current Phase)

## Field Types (Admin)

- GET /field-types
- POST /field-types

Response payload fields:

- id, name, key, base_type, settings, validation_rules, is_active

## Templates

- GET /templates
- POST /templates

POST /templates request:

- name
- schema.fields[]:
    - key
    - label
    - required
    - field_type_id

## Records

- GET /records?template_id={id}
- POST /records

POST /records request:

- template_id
- data

Validation behavior:

- unknown data keys rejected
- missing required fields rejected
- basic base_type checks enforced

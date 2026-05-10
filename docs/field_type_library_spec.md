# Form column types (fixed set)

The **`field_types` database catalog has been removed.** Admins define columns directly on each **template** using four built-in types.

## Allowed `base_type` values

| Value     | Meaning | Notes |
|-----------|---------|--------|
| `text`    | Free text | Optional `max` characters (255–10000, default 2000). UI uses a multi-line text control with `maxLength`. |
| `number`  | Numeric | Stored as provided; validated as numeric. |
| `date`    | ISO date | Format `YYYY-MM-DD`. |
| `boolean` | Yes/No | UI uses yes/no values; API accepts common boolean-ish literals. |

## Legacy templates

Older JSON may include `textarea` or `select` with extra `settings`. The API still validates those shapes when present so existing data remains usable.

## Governance (replaces field-type library rules)

1. Only **admin** can create, update, or delete templates.
2. Column keys must be unique within a template.
3. Schema edits are blocked when **records** already exist for that template.
4. A template cannot be deleted while any **entry** references it.

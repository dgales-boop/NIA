# Security and Access (Current Phase)

## Roles

- Admin
- Encoder

## Policy

- Admin manages **projects**, **templates (forms)**, and entry **close/reopen**.
- Encoders create entries and records; they may **update or delete only entries they created** (title only on update). Admins may update or delete entries subject to template-change rules when records exist.

## Access Controls

- Protect API routes with authentication middleware.
- Admin-only routes use `role:admin` middleware (`projects` POST/PUT/DELETE, `templates` POST/PUT/DELETE, entry close/reopen).

## Data Safety

- Log significant admin actions if/when an audit trail is added.
- Template **column schema** is immutable once **records** exist for that template.
- Entry **template_id** cannot change once the entry has **records**.

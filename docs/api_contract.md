# API Contract (Current Phase)

Stack: Laravel (session auth, JSON routes in `routes/web.php`) + Vite/React SPA.

## Templates

User-facing copy calls these **templates**; API routes use `/templates`.

- GET /templates (authenticated)
- GET /templates/{id} (authenticated)
- POST /templates (admin)
- PUT /templates/{id} (admin)
- DELETE /templates/{id} (admin)

POST/PUT body:

- `name` (string, required on create; optional on update if only renaming)
- `schema.fields[]` (required on create; optional on update if changing columns — blocked when any `records` exist for the template):
    - `key` (string)
    - `label` (string)
    - `required` (boolean, optional)
    - `base_type`: one of `text`, `number`, `date`, `boolean`
    - `max` (integer, optional, **text only**): clamped server-side; default 2000 if omitted; allowed range 255–10000

DELETE is rejected (422) if any **entries** reference the template.

## Projects

- GET /projects
- GET /projects/{id}
- POST /projects (admin)
- PUT /projects/{id} (admin)
- DELETE /projects/{id} (admin)

POST/PUT body:

- `name` (string)
- `description` (optional string, nullable)

DELETE is rejected (422) if the project has any **entries**.

## Entries

- GET /entries (optional query: `project_id`, `status`)
- POST /entries
- GET /entries/{id}
- PUT /entries/{id} (admin **or** encoder who created the entry)
- DELETE /entries/{id} (same rule as PUT)
- POST /entries/{id}/mark-exported (admin **or** encoder who created the entry; sets `status` to `exported`; idempotent if already exported)
- POST /entries/{id}/close (admin; only when current status is `open`)
- POST /entries/{id}/reopen (admin; only when current status is `closed` or `exported`)

`status` query filter accepts `open`, `closed`, or `exported`.

POST create body: `title`, `project_id`, `template_id`.

PUT: encoders may send **`title` only** (`project_id` / `template_id` are prohibited). Admins may send `title`, and optionally `project_id` / `template_id`; **`template_id` cannot change** if the entry already has **records**.

## Records

- GET /records?template_id={id}
- POST /records
- POST /records/bulk-store (`template_id`, `entry_id`, `rows[]`; entry must be **`open`**)

POST body:

- `template_id` (required)
- `entry_id` (optional; if set, must belong to an entry whose `template_id` matches the request, and that entry must be **`open`**)
- `data` (object; keys must match template schema keys)

Validation:

- Unknown `data` keys rejected
- Missing required fields rejected
- Types checked per `base_type`; text length checked against per-field `max` (or default)
- Legacy schemas may still contain `textarea` / `select`; those are validated when present

## Errors

HTTP 422 responses use Laravel’s `errors` object; the SPA maps the first messages into a single string for display.

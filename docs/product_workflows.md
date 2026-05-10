# Product Workflows

## Naming: template, project, and entry title

These three names show up together in the **Budget Entries** list. They are intentionally different roles:

- **Template** — Defines the **column layout** (schema) for the grid. One template can be reused on many entries (for example “Canal station inspection”).
- **Project** — **Groups** entries (site, program, irrigation project, or fiscal bucket). It is not the column layout; layouts come from templates.
- **Entry title** — The **label for one workbook** (one dataset: this project + this template + these rows). Prefer something that differs from the project and template in the table—such as a reporting period, batch, or phase—so staff can find the right row later.

The app can suggest an entry title from the selected project and template; encoders should still edit it when the suggested text would look redundant in lists.

## Admin workflow

1. Open **Projects** — create, edit, or delete projects (delete only when there are no entries).
2. Open **Templates** — list all column layouts; create a new template or edit an existing one.
3. In the template builder, add columns (`text` with optional max length, `number`, `date`, yes/no). Save.
4. Open **Budget Entries** — optionally close/reopen entries (admin only for status).

## Encoder workflow

1. Open **Projects**, pick a project to filter **Budget Entries**, or browse all entries.
2. Create an entry (project, template, then entry title—use a distinct label when possible).
3. Open the entry, add spreadsheet-style **rows**, and save each row as a **record**.
4. Edit or delete **own** entries (title only for encoders). Admins can adjust project and template where rules allow.

## Records review

1. Open an entry to see all rows for that budget record.
2. Export CSV from the entry detail screen.

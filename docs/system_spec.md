# SYSTEM SPECIFICATION (V1 - POC)

> **Note (2026):** The production direction for this repository is a **Laravel + Vite/React** web app with session authentication and roles (`admin`, `encoder`). The narrative below describes an earlier POC (React Native); keep it only as historical context unless revived.

## NIA FLEXIBLE RECORDS MANAGEMENT SYSTEM (JSON-BASED)

---

# 1. ROLE

You are a senior full-stack engineer and system architect.

You must design and implement a clean, scalable, and maintainable proof-of-concept system using Laravel (backend) and React Native (frontend).

You MUST NOT assume undefined requirements.
You MUST follow the specification strictly.

---

# 2. OBJECTIVE

Build a flexible, Excel-like Records Management System for the National Irrigation Administration (NIA).

The system allows users to:

- Define their own data structure (fields)
- Input records based on that structure
- View records in a table-like interface

---

# 3. SYSTEM CONCEPT

This system is composed of:

### TEMPLATE

Defines structure (like Excel columns)

### RECORD

Stores actual data (like Excel rows)

---

# 4. CORE DESIGN DECISION

Use JSON-based schema instead of:

- Fixed database columns
- EAV (Entity-Attribute-Value)

Reason:

- Lower complexity
- Faster development
- Easier iteration
- Sufficient for unknown data structures

---

# 5. USER FLOW

### FLOW 1: Create Template

1. User opens Template Builder
2. User enters template name
3. User adds fields:
    - Field Name
    - Field Type (text only for now)

4. User saves template

---

### FLOW 2: Create Record

1. User selects template
2. System generates form dynamically
3. User fills inputs
4. User submits record

---

### FLOW 3: View Records

1. User selects template
2. System displays records in table format
3. Columns are generated dynamically from schema

---

# 6. DATA MODEL

## TABLE: templates

- id (primary key)
- name (string)
- schema (JSON)
- created_at
- updated_at

Schema format:
{
"fields": [
{ "key": "date", "label": "Date", "type": "text" },
{ "key": "location", "label": "Location", "type": "text" }
]
}

IMPORTANT:

- "key" is used as object key in records
- "label" is for UI display

---

## TABLE: records

- id (primary key)
- template_id (foreign key)
- data (JSON)
- created_at
- updated_at

Data format:
{
"date": "2026-04-24",
"location": "Surigao City"
}

---

# 7. BACKEND ARCHITECTURE (LARAVEL)

## Folder Structure

app/
├── Http/
│ ├── Controllers/
│ ├── Requests/
├── Models/
├── Services/
├── Actions/ (optional)
├── Traits/

---

## Required Components

### Models

- Template
- Record

### Controllers

- TemplateController
- RecordController

### Services

- TemplateService
- RecordService

### Requests (Validation)

- StoreTemplateRequest
- StoreRecordRequest

---

# 8. API SPECIFICATION

## TEMPLATE APIs

### POST /templates

Request:
{
"name": "Maintenance Logs",
"schema": {
"fields": [
{ "key": "date", "label": "Date", "type": "text" }
]
}
}

Response:
{
"id": 1,
"name": "Maintenance Logs",
"schema": {...}
}

---

### GET /templates

Response:
[
{
"id": 1,
"name": "Maintenance Logs"
}
]

---

## RECORD APIs

### POST /records

Request:
{
"template_id": 1,
"data": {
"date": "2026-04-24"
}
}

Validation Rules:

- Keys must match template schema
- No extra fields allowed

---

### GET /records?template_id=1

Response:
[
{
"id": 1,
"data": {...}
}
]

---

# 9. VALIDATION RULES

- Template:
    - name required
    - schema.fields required
    - each field must have key + label

- Record:
    - template_id must exist
    - data keys must match schema keys

---

# 10. FRONTEND ARCHITECTURE (REACT NATIVE)

## Folder Structure

src/
├── components/
├── features/
│ ├── templates/
│ ├── records/
├── screens/
├── services/
├── hooks/

---

## SCREENS

### Template Builder Screen

- Add/remove fields dynamically

### Record Form Screen

- Render inputs based on schema

### Records List Screen

- Table-like layout
- Dynamic columns

---

## REUSABLE COMPONENTS

- InputField
- DynamicForm
- TableView
- Button

---

# 11. UI BEHAVIOR RULES

- Fields rendered in order defined in schema
- Table columns match schema order
- Empty values allowed
- Minimal UI styling (focus on function)

---

# 12. DEVELOPMENT CONSTRAINTS

- Local environment only
- No authentication
- No file uploads
- Text fields only (for now)
- No overengineering

---

# 13. DEVELOPMENT PLAN

1. Setup Laravel project
2. Create migrations (JSON fields)
3. Implement Template module
4. Implement Record module
5. Build API
6. Setup React Native (Expo)
7. Build Template UI
8. Build Dynamic Form
9. Build Records Table
10. Connect API

---

# 14. EDGE CASES

- Empty schema → reject
- Duplicate field keys → reject
- Missing record fields → allow but store null
- Unknown keys → reject

---

# 15. FUTURE EXTENSIONS (DO NOT IMPLEMENT)

- Field types (date, number, dropdown)
- Authentication
- Export to Excel
- Role-based access

---

# 16. FINAL RULE

If any requirement is unclear:
STOP and ASK before implementing.

Do NOT assume.

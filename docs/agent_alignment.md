# Agent Alignment Guide (Mandatory)

## Purpose

This document is the implementation guardrail for all AI agents and developers working on this repository.

## Product Goal

Deliver a staff-friendly records management system with flexible templates and safe data quality controls.

## Non-Negotiables

1. Keep implementation practical and non-overengineered.
2. Prioritize non-technical staff usability over advanced configuration.
3. Column types are fixed (`text`, `number`, `date`, `boolean`); template builders pick one per field. Text supports optional `max` length.
4. Template builders must use only these four column types for new templates.
5. Required record fields must be enforced.
6. Template structures become immutable once records exist.
7. Preserve backward compatibility for existing records (legacy `base_type` values in JSON where applicable).

## In Scope (Current Phase)

- Four column types on templates + validation (`StoreTemplateRequest`, `StoreRecordRequest`)
- Template/project/entry CRUD with guards documented in `docs/api_contract.md`
- Record validation hardening (required + types + entry/template match)
- Staff-first UX (templates list, builder, project table, entry grid)

## Out of Scope (Current Phase)

- Advanced conditional fields
- Formula/derived fields
- Full enterprise RBAC matrix
- Workflow engines

## Simplicity Rules

- Prefer explicit validation over dynamic magic.
- Prefer additive database changes over destructive refactors.
- Prefer clear plain-language UI copy.
- Keep APIs predictable and version-safe.

## Change Acceptance Checklist

- Contract documented
- Validation rules tested
- Backward compatibility reviewed
- Non-technical UX impact reviewed
- Security access path reviewed

## Stop-and-Ask Triggers

Stop and ask before implementing when:

- A change can break existing templates/records.
- A feature adds advanced logic not in current phase.
- Security/access decisions are unclear.

# Agent Alignment Guide (Mandatory)

## Purpose

This document is the implementation guardrail for all AI agents and developers working on this repository.

## Product Goal

Deliver a staff-friendly records management system with flexible templates and safe data quality controls.

## Non-Negotiables

1. Keep implementation practical and non-overengineered.
2. Prioritize non-technical staff usability over advanced configuration.
3. Field types must be governed by Admins only.
4. Template builders must choose from approved field types.
5. Required record fields must be enforced.
6. Template structures become immutable once records exist.
7. Preserve backward compatibility for existing records.

## In Scope (Current Phase)

- Field Type Library foundation (backend + docs + tests)
- Starter Catalog v1 seeding
- Template validation update for field type references
- Record validation hardening (required + type basics)
- Staff-first UX iteration (later phase)

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

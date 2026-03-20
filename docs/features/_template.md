# Feature: <Name>

## Problem Statement

What user problem does this solve? One paragraph.

## User Flows

### Flow 1: <Name>

**Intent:** What the user is trying to accomplish.
**Steps:**

1. User does X
2. System responds with Y
3. User sees Z

## User Acceptance Tests

One per user flow. Each becomes a Playwright spec.

- `tests/e2e/<flow-name>.spec.ts` — <description>

## Requirements

Numbered, testable.

- R1: <requirement>
- R2: <requirement>

## Non-Functional Requirements

- NFR1: <e.g., results appear within 200ms>

## Domain Alignment

- Canonical terms used (must match `docs/ubiquitous-language.md`):
- Affected bounded context:
- Invariants:

## Design

- Pencil file: `design/<name>.pen`
- Component mapping:
  - <design region> → `app/components/<Component>.vue`

## Slices

### Slice 1: <Name>

**User story:** As a <role>, I want to <action>, so that <benefit>.

**Acceptance criteria:**

1. Given <precondition>, when <action>, then <result>

**Requirements:** R1, R2 (reference parent requirements this slice covers)

**Implementation plan:**

- `app/notes/<file>.ts` — <what changes>
- `app/composables/<file>.ts` — <what changes>
- `app/components/<Component>.vue` — <what changes>

**Unit tests:**

- `tests/unit/notes/<file>.test.ts`
  - `it('<description of behavior>')`
  - `it('<description of behavior>')`

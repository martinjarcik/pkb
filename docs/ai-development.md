# AI Development Workflow

This document outlines 4 mandatory phases for every change. Do not skip any.

## Execution contract

Follow these rules for the whole workflow:

- Create branch `feat/<slug>` from `main` at the start of Phase 4; all implementation work stays on that branch.
- The feature spec is a conversation artifact only; do not commit it as a repo file.
- Phases are strictly sequential: complete each phase before starting the next.
- You MUST pass all unit tests and UAT (Playwright) before finalizing; do not proceed while any test fails.
- You MUST satisfy `AGENTS.md` and align with the authoritative docs where applicable.
- End with a pull request for human review.

## Authoritative docs

Use these paths when aligning language, structure, or code rules:

| Doc                           | Use                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| `docs/ubiquitous-language.md` | Canonical terms and domain language                         |
| `docs/architecture.md`        | Architectural assumptions and boundaries                    |
| `AGENTS.md`                   | Naming, complexity, folders, types                          |
| `design/design.png`           | Visual reference when Pencil MCP is unavailable (see below) |

**Visual design (`design/design.png`).** When Pencil tools are not available and you need to understand the UI visually, use `design/design.png`. **Design style and layout in that image are final** (colors, typography, spacing, panel structure). **Depicted features, labels, and copy are speculative**—they illustrate the look and feel, not product scope or requirements unless a feature request or authoritative doc says otherwise.

---

## Phase 1: Trigger & User Interview

This phase starts with the user's feature brief, which may already answer some or all of the discovery questions below. Compare the brief against this checklist and ask only for information that is still missing. The phase ends when all five areas are covered by the brief, follow-up answers, or an explicit statement that the information is unknown or out of scope.

1. Problem

- What problem does this feature solve?
- Who experiences it and when?

1. Scenario

- Describe a concrete example of how the user would use this feature step by step.

1. Current behavior

- How is this handled today?
- What is not working well?

1. Success

- What should be different after this is implemented?
- How will success be measured?

1. Constraints

- Any technical, data, or business constraints?
- What is explicitly out of scope?

---

## Phase 2: Feature Definition

This phase takes the feature brief plus the answers gathered in Phase 1 and turns them into a completed feature spec in the conversation. The phase ends when the feature spec is complete, the vertical slices are defined, and unresolved assumptions have been answered by the user.

Any alternative planning format is invalid. Planning output must follow the required Phase 1 -> Phase 2 -> Phase 3 structure and templates in this document.

### Feature spec template

Structure: One top-level title `# Feature: <name>`, then sections 1–5 once and section 6 once per vertical slice. Use plain lines and indentation as in the fence; do not add extra nested markdown inside the spec body.

```
# Feature: <name>

@ before completing the template, incorporate the feature brief and Phase 1 answers; then list any remaining assumptions about scope, behavior, or design not stated in the brief, interview, or authoritative docs; present them to the user and wait for answers before proceeding

1. Problem statement
   @ one paragraph: what the user wants to achieve and suggested solution

2. User flows
   @ Identify all applicable user flows; for each one document this block. UATs validate behavior (state transitions, outcomes), not visual presentation; visual details belong in the design file.
   @ UAT rules:
   - one primary outcome per scenario
   - split scenarios if two failures would be fixed in different places
   - use And only for the same concern
   - do not assert general app behavior unless this feature introduces or changes it
   Intent: <what the user is trying to accomplish>
   UAT: <BDD syntax>

3. User requirements
   @ Testable product capabilities and user-facing behavior; do not describe UI structure or component existence; do not add UI changes beyond what the feature request explicitly asks for.
   @ R1..Rn: only what this feature adds or changes; assume existing selection, editing, property persistence, and coherent UI unless narrowing a new guarantee.
   R1: <requirement>
   R2: <requirement>

4. Domain alignment
   @ Re-read docs/ubiquitous-language.md and docs/architecture.md before finalizing this section. Verify terms match docs/ubiquitous-language.md and assumptions match docs/architecture.md.
   Canonical terms (must match docs/ubiquitous-language.md): <terms>
   Affected bounded context: <context>
   Invariants: <invariants>

5. Design
   @ Read design/design.pen via Pencil MCP tools and map design regions to implementation components; if Pencil tools are unavailable, use design/design.png for visual alignment (style and layout are authoritative; image content is speculative—see Authoritative docs) and continue.
   @ Keep the mapping aligned with the user flows and requirements above; if a required behavior has no matching design region or a mapped region supports no requirement, call that out.
   Component mapping:
   - <design region> -> app/components/<Component>.vue

6. Vertical slices (repeat for each slice)
   @ User-meaningful increments only; no slice whose sole role is enabling another—fold into the slice that delivers the behavior or Phase 4 scaffolding.
   Slice Name: <slice name>
   Slice Description: <slice description>
   UAT: <BDD format>
   Requirements covered: <R1..Rn covered by this slice>


```

---

## Phase 3: Technical Plan

This phase takes the completed feature spec from Phase 2 and translates it into concrete technical decisions. Resolve every ambiguity that would otherwise be decided ad hoc during the TDD loop, apply `AGENTS.md` when pinning names, types, folders, and abstractions.

### Technical plan template

Structure: One top-level title `# Technical Plan: <name>`, then sections 1–5. Use plain lines and indentation as in the fence; do not add extra nested markdown inside the plan body.

```
# Technical Plan: <name>

1. Branch and feature flag
   Branch: feat/<slug>
   Feature flag: <flag name in app/config/default.yaml, or "none — feature is not optional">

2. Domain changes
   @ Derive this section from Phase 2 section 4 (Domain alignment): canonical terms, bounded context, and invariants.
   @ Pin every new or changed type, field name, and default value. Reference the canonical model in app/notes/types.ts and storage contract in app/storage/types.ts. If a new domain term is introduced, state the ubiquitous-language entry here.
   New/changed types: <type name, field, type, default>
   Storage impact: <what changes in the NoteStorage contract or serialization, if any>
   New canonical terms: <term and meaning, or "none">

3. Scaffolding
   @ List shared types, helpers, or wiring that slices depend on but that are not themselves slice-deliverable behavior. Keep minimal; fold into slice 1 if possible.
   @ Reference the component mapping from Phase 2 section 5 so the plan is explicit about which existing or new components are affected.
   - <item and rationale>

4. Unit tests per slice
   @ For each vertical slice from the feature spec, list the unit tests that will drive its implementation. Each test: a short name, the module/function under test, the behavior it asserts, and which requirement(s) it traces to. One primary assertion per test.
   Slice: <slice name>
   - T1: <test name> — <module/function> — <asserted behavior> — <R#>
   - T2: ...

5. Micro-architecture notes
   @ Optional. Only if the feature introduces a data flow, composable, or cross-component interaction pattern not obvious from the existing codebase. Keep to a few sentences or a short list; do not over-design.
   <notes, or "none">
```

---

## Phase 4: Implementation

This phase starts after the user has approved the Phase 3 technical plan. Use the completed feature spec, the approved technical plan, and the execution contract as inputs. All implementation work stays on the feature branch, and the phase ends with passing tests, updated docs, and a pull request for human review.

1. Create branch per the execution contract.

### Step 1: Scaffolding

1. Feature flag: apply the decision from the technical plan (section 1).
2. Implement the domain changes from the technical plan (section 2): types, fields, defaults, storage contract updates.
3. Add any remaining shared code listed in the technical plan (section 3).
4. Commit: `feat(<slug>): scaffold supporting code`

### Step 2: TDD loop

Repeat for each slice in order. For each unit test listed in the technical plan (section 4):

1. Write the failing unit test.
2. Make the smallest change that makes the test pass.
3. Polish: names, duplication inside the slice, clarity.
4. Commit: `feat(<slug>): <what the test verifies>`

### Step 3: UAT tests

1. Implement all Playwright e2e tests from the feature spec. Use the component mapping from Phase 2 section 5 to keep selectors and interacted page regions aligned with the intended UI areas.
2. Commit: `test(<slug>): add UAT tests`

### Step 4: Verification

1. Run all unit tests; they MUST pass.
2. Run all UAT tests; they MUST pass.
3. Confirm every requirement R1..Rn from the spec is implemented.

If any test fails: fix, re-run, and do not continue until green.

### Step 5: Critical review (four-lens code review)

Perform one pass per lens. Each lens is mandatory; fix issues before finalize.

Lens 1 — Correctness and spec fit

- Behavior matches the feature spec and accepted user flows.
- Requirements R1..Rn are fully met; tests actually prove the intended behavior, including important edge cases.

Lens 2 — Safety and trustworthiness

- User inputs and external data are validated and sanitized where needed.
- No obvious security footguns (injection, unsafe defaults, leaking sensitive data, unsafe file or URL handling) introduced by this change.

Lens 3 — Standards and maintainability

- Code follows `AGENTS.md` (naming, complexity, folder boundaries, types).
- YAGNI: every new file, type, and abstraction is required to pass the current tests; remove speculative “future” structure.

Lens 4 — Performance and simplicity

- No unnecessary complexity or overengineering beyond what the spec and tests require.
- Obvious performance problems that can be fixed without adding significant complexity are addressed.

### Step 6: Finalize

1. Run all unit and UAT tests again; fix failures.
2. Update `CHANGELOG.md`.
3. Update `docs/product.md` (feature and how to use it).
4. If the canonical model or terminology changed: update `docs/architecture.md` and `docs/ubiquitous-language.md`.
5. If component mappings changed: update `design/design.pen` (Pencil MCP tools).
6. If there is a notable architectural decision: record it in `docs/decisions.md`.
7. Commit: `docs(<slug>): update changelog and documentation`
8. Open a pull request for human review.

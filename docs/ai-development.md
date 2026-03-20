# AI Development Workflow

## Phase 1: Trigger

Input: Human asks to develop a feature.

1. Read `docs/features/backlog.md` to identify the feature.
2. Read `docs/features/<slug>.md`.
   If it does not exist, create it from `docs/features/_template.md`. If it does exist, but does not match the template, recreate it using the template.
3. Create branch `feat/<slug>` from `main`.

## Phase 2: Feature Definition

Input: The feature spec file (`docs/features/<slug>.md`).

1. Fill in every section of the feature spec:
   - Problem statement
   - User flows with concrete steps
   - User acceptance tests (one Playwright spec per flow)
   - Numbered requirements (testable, specific)
   - Non-functional requirements
   - Domain alignment using canonical terms from `docs/ubiquitous-language.md`
   - Design references (Pencil file, component mapping)
2. Before finalizing the feature spec, verify that its domain language matches
   `docs/ubiquitous-language.md` and that its architectural assumptions match
   `docs/architecture.md`.
3. Break the feature into vertical slices. Every slice must:
   - Represent an end-to-end user flow
   - Be documented as a user story
   - Satisfy INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)
   - Have acceptance criteria in Given/When/Then format
   - Have an implementation plan listing affected files
   - Have defined unit tests coupled to behavior, decoupled from code structure
   - Deliver individual user value (not be a technical implementation artifact)
   - Have single responsibility with no overlap with other slices
4. Perform a review of all slices together. The review must verify:
   - No duplicate requirements across slices
   - No overlapping responsibilities between slices
   - Every parent requirement (R1..Rn) is covered by at least one slice
   - Consistency across slice definitions
   - The solution is not overengineered or unnecessarily complex
   - High confidence in predictability of implementation
   - Consistency with `docs/ubiquitous-language.md` and `docs/architecture.md`
5. Fix any issues found by the review.
6. Commit the feature spec: `docs(<slug>): define feature specification`

## Phase 3: Implementation

Input: The completed feature spec with all slices defined.

Every feature is developed in its own `feat/<slug>` branch.

### Step 1: Scaffolding

1. If the feature is optional or togglable, add a feature flag to
   `app/config/default.yaml` (default: `false`) and the `AppConfig` type
   in `app/config/loader.ts`. Core features that the app cannot function
   without do not need a flag.
2. Implement any shared types or supporting code required by the slices
   that will not be covered by unit tests.
3. Commit: `feat(<slug>): scaffold supporting code`

### Step 2: TDD Loop

Repeat for each slice, in order. For each unit test defined in the slice:

1. Write the failing unit test.
2. Write the smallest change needed to make the test pass.
3. Polish the implementation — clean up names, remove duplication within the
   slice, ensure the code reads clearly.
4. Commit: `feat(<slug>): <what the test verifies>`

### Step 3: UAT Tests

1. Implement all Playwright e2e tests defined in the feature spec.
2. Commit: `test(<slug>): add UAT tests`

### Step 4: Verification

1. Run all unit tests and confirm they pass.
2. Run all UAT tests and confirm they pass.
3. Verify every requirement (R1..Rn) in the feature spec has been implemented.

If any test fails, fix the issue and re-run. Do not proceed until all pass.

### Step 5: Critical Review

Perform a review of the complete implementation:

1. Does the implementation match the feature spec?
2. Does the code satisfy all rules in `AI_RULES.md`?
   (naming, complexity constraints, folder boundaries, type conventions)
3. YAGNI: is every new file, type, and abstraction needed to pass the current
   tests? Remove anything that exists only for future extensibility.
4. Are there obvious performance issues fixable without adding complexity?
5. Are there user inputs that are not validated or sanitized?

Fix any issues found by the review.

### Step 6: Finalize

1. Run all unit tests and UAT tests. Fix if they fail.
2. Update `CHANGELOG.md` with the new feature.
3. Update `docs/product.md` with the new feature and how to use it.
4. Update `docs/architecture.md` and `docs/ubiquitous-language.md` if the
   feature changes the canonical model or terminology.
5. Update `design/pencil.md` with new component mappings if any.
6. Record any architectural decisions in `docs/decisions.md`.
7. Commit: `docs(<slug>): update changelog and documentation`
8. Create a pull request for human review.

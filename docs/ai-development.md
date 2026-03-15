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
   - Design references (Pencil file, component mapping)
2. Break the feature into vertical slices. Every slice must:
   - Represent an end-to-end user flow
   - Be documented as a user story
   - Satisfy INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)
   - Have acceptance criteria in Given/When/Then format
   - Have an implementation plan listing affected files
   - Have defined unit tests coupled to behavior, decoupled from code structure
   - Deliver individual user value (not be a technical implementation artifact)
   - Have single responsibility with no overlap with other slices
3. Use a sub-agent to review all slices together. The review must verify:
   - No duplicate requirements across slices
   - No overlapping responsibilities between slices
   - Every parent requirement (R1..Rn) is covered by at least one slice
   - Consistency across slice definitions
   - The solution is not overengineered or unnecessarily complex
   - High confidence in predictability of implementation
4. Fix any issues found by the review.
5. Commit the feature spec: `docs(<slug>): define feature specification`

## Phase 3: Implementation

Input: The completed feature spec with all slices defined.

Every feature is developed in its own `feat/<slug>` branch.

### Step 1: Scaffolding

1. Add a feature flag to `app/config/default.yaml` (default: `false`) and
   the `AppConfig` type in `app/config/loader.ts`. The feature must be
   gated behind this flag so it can be enabled or disabled via configuration.
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

Use a sub-agent to review the complete implementation. The review must answer
these yes/no questions:

**Consistency:**

- Does the implementation match the feature spec?
- Are naming conventions consistent with `AI_RULES.md`?

**Overengineering (YAGNI):**

- Is every new file needed to pass the current tests?
- Is every new type/interface used by more than one consumer?
- Could any abstraction be replaced with inline code?
- Is there any configuration for something with only one variant?
- Is there any interface with only one implementation?

**Complexity:**

- Are there functions longer than 30 lines that could be extracted?
- Is there nesting deeper than 3 levels that could be flattened with early returns?

**Performance:**

- Are there obvious performance issues fixable without adding complexity?

**Security:**

- Are there user inputs that are not validated or sanitized?

Fix any issues found by the review.

### Step 6: Finalize

1. Run all unit tests and UAT tests. Fix if they fail.
2. Update `CHANGELOG.md` with the new feature.
3. Update `docs/product.md` with the new feature and how to use it.
4. Update `design/pencil.md` with new component mappings if any.
5. Record any architectural decisions in `docs/decisions.md`.
6. Commit: `docs(<slug>): update changelog and documentation`
7. Create a pull request for human review.

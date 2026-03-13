# AI Development Workflow

## Domain feature (touches note logic)

1. Identify the feature location in `app/notes/`.
2. Write e2e test in `tests/e2e/`.
3. Implement domain logic in `app/notes/`.
4. Write unit tests in `tests/unit/`.
5. Expose behavior through a composable in `app/composables/`.
6. Implement UI in `app/components/`.

## UI-only change (no domain logic)

1. Identify the target component or layout.
2. Implement the change in `app/components/` or `app/layouts/`.
3. If shared state is needed, add a composable in `app/composables/`.

## Configuration change

1. Update the `AppConfig` type in `app/config/loader.ts`.
2. Update `app/config/default.yaml` to match.
3. Wire the config value into the relevant composable or component.

## New page

1. Create the route file in `app/pages/`.
2. Use existing components and composables.

## Testing strategy

- Unit tests → domain logic (`app/notes/`, `app/storage/`)
- E2E tests → user-visible behavior and flows (Playwright)

Test file paths mirror the source they cover:

- `app/notes/types.ts` → `tests/unit/notes/types.test.ts`
- `app/storage/browser.ts` → `tests/unit/storage/browser.test.ts`
- E2E tests: one file per flow, e.g. `tests/e2e/create-note.test.ts`

## After every change

- Run `npm run lint:fix` to fix lint errors.
- Run `npm run format` to normalize formatting.
- Run `npm run typecheck` to verify types.
- Run `npm run test:unit:ci` to verify unit tests pass.

All four checks also run automatically via the pre-commit hook.

- Record any architectural decision in `docs/decisions.md`.
- Use conventional commit messages (enforced by commitlint): `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`.

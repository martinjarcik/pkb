# AI Development Workflow

## Domain feature (touches note logic)

1. Identify the feature location in `app/notes/`.
2. Write acceptance test in `tests/acceptance/`.
3. Implement domain logic in `app/notes/`.
4. Write unit tests in `tests/unit/`.
5. Expose behavior through a composable in `app/composables/`.
6. Implement UI in `app/components/`.

## UI-only change (no domain logic)

1. Identify the target component or layout.
2. Implement the change in `app/components/` or `app/layouts/`.
3. If shared state is needed, add a composable in `app/composables/`.

## Configuration change

1. Update the schema in `app/config/loader.ts`.
2. Update `app/config/default.yaml` to match.
3. Wire the config value into the relevant composable or component.

## New page

1. Create the route file in `app/pages/`.
2. Use existing components and composables.

## Testing strategy

- Unit tests → domain logic (`app/notes/`, `app/storage/`)
- Acceptance tests → user-visible behavior and flows

## After every change

- Record any architectural decision in `docs/decisions.md`.

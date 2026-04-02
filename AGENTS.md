# Required Workflow

## Mandatory inputs

- `AGENTS.md` and `docs/ai-development.md` are mandatory at full scope for every plan and every code change.
- Treat `AGENTS.md` as the canonical coding-rules contract for this repository.
- Treat `docs/ai-development.md` as the canonical workflow contract for planning and implementation.

## Planning contract

- For any planning request, you must follow the exact Phase 1 -> Phase 2 -> Phase 3 sequence defined in `docs/ai-development.md`.
- Planning output must use the required artifacts and templates from `docs/ai-development.md`.
- Any alternative planning format is invalid.
- Do not skip phases, compress phases together, or substitute your own planning structure.

## Consistency contract

- If a required file is missing, contradictory, or stale, stop and call that out explicitly before proceeding.
- `AI_RULES.md` is not a valid reference in this repository. If another file mentions it, treat that as a repo inconsistency to surface and fix.

## Source of truth

- Coding rules, folder boundaries, naming, testing, and quality constraints live in `AGENTS.md`.
- Planning and implementation workflow lives in `docs/ai-development.md`.
- Architecture and implementation boundaries live in `docs/architecture.md`.
- Canonical terminology lives in `docs/ubiquitous-language.md`.

## Philosophy

This is a configurable application, not a plugin platform.

Prefer:

- explicit implementation over abstraction
- predictable, flat structure
- simple code with obvious intent
- modifying existing files over creating new ones

Avoid:

- plugin systems, extension registries, generic frameworks
- speculative modularization
- `utils/`, `helpers/`, `shared/` folders
- `index.ts` barrel files
- abstract base classes

### Examples

Wrong - barrel file re-exporting everything:

```ts
// app/notes/index.ts
export * from './types'
```

Right - import directly from the source file:

```ts
import type { Note } from '~/notes/types'
```

Wrong - generic utility folder:

```ts
// app/utils/strings.ts
export function capitalize(s: string) { ... }
```

Right - put the function where it is used, or in the domain folder it belongs to.

## Folder boundaries

Nuxt auto-imported (do not add explicit imports):

- `app/components/` -> UI rendering
- `app/composables/` -> shared Vue state and UI logic
- `app/pages/` -> routes
- `app/layouts/` -> page layouts
- `$fetch` -> Nuxt HTTP client available globally in app code without import

Explicit imports required:

- `app/notes/` -> pure note domain logic
- `app/storage/` -> persistence
- `app/config/` -> configuration loading

shadcn-vue managed:

- `app/components/ui/` -> shadcn-vue components (added via `npx shadcn-vue@latest add`)
- `app/lib/utils.ts` -> `cn()` utility for shadcn-vue class merging
- `app/lib/` -> Editor.js tool classes and markdown conversion modules (besides `utils.ts`)

Other:

- `app/assets/css/` -> stylesheets and theme CSS variables
- `tests/unit/` -> domain logic tests
- `tests/e2e/` -> end-to-end tests (Playwright)
- `docs/` -> architecture, decisions, workflow, product manual

Ignored (do not read or modify):

- `drafts/` -> personal brainstorm notes, not authoritative

Design:

- `design/` -> Pencil design files (`.pen`)
- `design/design.pen` -> canonical UI design (read via Pencil MCP tools only)

Reserved (create when first needed):

- `desktop/tauri/` -> Tauri desktop packaging

## Naming conventions

- Vue components: `PascalCase.vue` (for example `NotesListPanel.vue`)
- Composables: `useXxx.ts` (for example `useNotes.ts`)
- Domain and storage files: `camelCase.ts` (for example `browser.ts`)
- Unit test files: `*.test.ts`
- E2E test files: `*.spec.ts`
- Import alias: `~/` from app root (for example `import { Note } from '~/notes/types'`)
- Use relative imports (`./`) within the same folder
- Use `~/` for all imports from app root. `@/` is reserved for shadcn-vue tooling only.

## Types

- Use `type` for all type definitions. Do not use `interface`.
- Export explicit types for all public contracts.
- Keep types co-located with the logic that uses them.

## Domain logic

Domain folders (`app/notes/`, `app/storage/`, `app/config/`) contain pure TypeScript.

Allowed imports:

- npm packages (for example `yaml`)
- other domain folders via `~/`
- same-folder files via `./`

Forbidden imports:

- `vue`, `#app`, `#imports`, `nuxt/app`, any `@vue/*` package
- anything from `app/components/`, `app/composables/`, `app/pages/`, `app/layouts/`

For state management, error handling, and configuration patterns, see `docs/architecture.md`.

## Components

- shadcn-vue primitives in `app/components/ui/` are managed by CLI. Do not edit them manually.
- Use `cn()` from `~/lib/utils` to merge Tailwind classes conditionally.
- Use Tailwind utility classes for styling. Reference theme tokens via CSS variables (for example `text-foreground`, `bg-primary`).
- Do not use scoped `<style>` blocks for layout. `<style scoped>` is acceptable only for animations or overrides Tailwind cannot express.
- Keep components focused on rendering. Extract shared state into `app/composables/`.
- Do not import from `app/notes/`, `app/storage/`, or `app/config/` directly. Access domain data through composables.

## Testing

Unit tests (`tests/unit/`):

- Runner: Vitest with `@nuxt/test-utils`
- File naming: `*.test.ts`
- Import from `vitest`: `import { describe, it, expect } from 'vitest'`
- Test pure logic only. Do not test Vue components in unit tests.

E2E tests (`tests/e2e/`):

- Runner: Playwright
- File naming: `*.spec.ts`
- Import from `@playwright/test`: `import { test, expect } from '@playwright/test'`
- Tests run against `http://localhost:3000`

General:

- Do not mix unit and e2e patterns.
- Keep tests focused. One logical assertion per `it` or `test` block.

## Complexity constraints

- Keep functions short and focused. If a function exceeds 30 lines, look for extraction opportunities.
- Avoid nesting deeper than 3 levels. Use early returns to flatten logic.
- Do not create a new abstraction unless it is used in 3+ places today.
- Do not add generics or type parameters unless the function is called with 2+ different types.
- Do not create wrapper types that add no behavior.
- Do not create factory functions for simple object creation.
- Do not add error handling for impossible states.
- Do not create abstractions for future extensibility.
- If a function has only one caller, consider inlining it.

## Theming

Theming uses CSS custom properties via Tailwind CSS and shadcn-vue.

- Do not create a separate theme module or JS token objects.
- Custom themes are CSS variable sets defined in `app/assets/css/`.
- Theme selection logic belongs in `app/composables/`.

## Modification rules

- Put code in the most obvious existing folder.
- Folders listed in "Folder boundaries" above are approved. Create them when first needed.
- Do not create folders outside that list without explicit approval.
- When unsure where code belongs, check the folder boundaries above. If none fits, ask.

## Decisions

Record architectural decisions in `docs/decisions.md` using this format:

```md
## D00X - YYYY-MM

One-line description of the decision.
```

## Quality checks

Run after every change:

- `npm run lint:fix`
- `npm run format`
- `npm run typecheck`
- `npm run test:unit:ci`

Git hooks enforce lint, format, typecheck, unit tests, and conventional commit
messages automatically on commit.

Allowed commit prefixes:

- `feat:`
- `fix:`
- `chore:`
- `refactor:`
- `docs:`
- `test:`
- `style:`
- `build:`
- `ci:`
- `perf:`

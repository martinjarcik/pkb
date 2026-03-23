# AI Rules

This repository is developed exclusively by LLMs.
Read this file before making any changes.

Every project change MUST follow `docs/ai-development.md` and MUST do all phases.

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

Exception: Tiptap extensions and custom nodes are the sanctioned extensibility
mechanism for the content editor. These follow Tiptap's own extension API and
are not general-purpose plugin infrastructure.

### Examples

Wrong — barrel file re-exporting everything:

```ts
// app/notes/index.ts
export * from './types'
```

Right — import directly from the source file:

```ts
import type { Note } from '~/notes/types'
```

Wrong — generic utility folder:

```ts
// app/utils/strings.ts
export function capitalize(s: string) { ... }
```

Right — put the function where it is used, or in the domain folder it belongs to.

## Folder boundaries

Nuxt auto-imported (do not add explicit imports):

- `app/components/` → UI rendering
- `app/composables/` → shared Vue state and UI logic
- `app/pages/` → routes
- `app/layouts/` → page layouts

Explicit imports required:

- `app/notes/` → pure note domain logic
- `app/storage/` → persistence
- `app/config/` → configuration loading

shadcn-vue managed:

- `app/components/ui/` → shadcn-vue components (added via `npx shadcn-vue@latest add`)
- `app/lib/utils.ts` → `cn()` utility for shadcn-vue class merging

Other:

- `app/assets/css/` → stylesheets, theme CSS variables
- `tests/unit/` → domain logic tests
- `tests/e2e/` → end-to-end tests (Playwright)
- `docs/` → architecture, decisions, workflow, product manual

Ignored (do not read or modify):

- `drafts/` → personal brainstorm notes, not authoritative

Design:

- `design/` — Pencil design files (`.pen`)
  - `design/design.pen` — canonical UI design (read via Pencil MCP tools only)

Reserved (create when first needed):

- `desktop/tauri/` → Tauri desktop packaging

## Naming conventions

- Vue components: `PascalCase.vue` (e.g. `NotesListPanel.vue`)
- Composables: `useXxx.ts` (e.g. `useNotes.ts`)
- Domain and storage files: `camelCase.ts` (e.g. `browser.ts`)
- Unit test files: `*.test.ts` (e.g. `notes.test.ts`)
- E2E test files: `*.spec.ts` (e.g. `create-note.spec.ts`)
- Import alias: `~/` from app root (e.g. `import { Note } from '~/notes/types'`)
- Use relative imports (`./`) within the same folder (e.g. `import { NoteStorage } from './types'`)
- Use `~/` for all imports from app root. `@/` is reserved for shadcn-vue tooling only.

## Types

- Use `type` for all type definitions. Do not use `interface`.
- Export explicit types for all public contracts.
- Keep types co-located with the logic that uses them (e.g. `types.ts` in the same folder).

## Domain logic

Domain folders (`app/notes/`, `app/storage/`, `app/config/`) contain pure TypeScript.

Allowed imports:

- npm packages (e.g. `yaml`)
- Other domain folders via `~/` alias (e.g. `import type { Note } from '~/notes/types'`)
- Same-folder files via `./` (e.g. `import { NoteStorage } from './types'`)

Forbidden imports:

- `vue`, `#app`, `#imports`, `nuxt/app`, any `@vue/*` package
- Anything from `app/components/`, `app/composables/`, `app/pages/`, `app/layouts/`

For state management, error handling, and configuration patterns, see `docs/architecture.md`.

## Components

- shadcn-vue primitives in `app/components/ui/` are managed by CLI. Do not edit them manually.
- Use `cn()` from `~/lib/utils` to merge Tailwind classes conditionally.
- Use Tailwind utility classes for styling. Reference theme tokens via CSS variables (e.g. `text-foreground`, `bg-primary`).
- Do not use scoped `<style>` blocks for layout. `<style scoped>` is acceptable only for animations or overrides Tailwind cannot express.
- Keep components focused on rendering. Extract shared state into `app/composables/`.
- Do not import from `app/notes/`, `app/storage/`, or `app/config/` directly — access domain data through composables.

## Testing

Unit tests (`tests/unit/`):

- Runner: Vitest with `@nuxt/test-utils`.
- File naming: `*.test.ts`. Mirror source paths: `app/notes/parser.ts` → `tests/unit/notes/parser.test.ts`.
- Import from `vitest`: `import { describe, it, expect } from 'vitest'`.
- Test pure logic only. Do not test Vue components in unit tests.

E2E tests (`tests/e2e/`):

- Runner: Playwright.
- File naming: `*.spec.ts`. One file per user flow (e.g. `create-note.spec.ts`).
- Import from `@playwright/test`: `import { test, expect } from '@playwright/test'`.
- Tests run against `http://localhost:3000`.

General:

- Do not mix unit and e2e patterns. Unit tests assert return values; e2e tests assert page behavior.
- Keep tests focused — one logical assertion per `it`/`test` block.

## Complexity constraints

- Keep functions short and focused. If a function exceeds 30 lines, look for extraction opportunities.
- Avoid nesting deeper than 3 levels. Use early returns to flatten logic.
- Do not create a new abstraction unless it is used in 3+ places today.
- Do not add generics/type parameters unless the function is called with 2+ different types.
- Do not create wrapper types that add no behavior.
- Do not create factory functions for simple object creation.
- Do not add error handling for impossible states.
- Do not create abstractions for future extensibility.
- If a function has only one caller, consider inlining it.

## Theming

Theming uses CSS custom properties via Tailwind CSS and shadcn-vue.
Do not create a separate theme module or JS token objects.
Custom themes are CSS variable sets defined in `app/assets/css/`.
Theme selection logic belongs in `app/composables/`.

## Modification rules

- Put code in the most obvious existing folder.
- Folders listed in "Folder boundaries" above are approved. Create them when first needed.
- Do not create folders outside that list without explicit approval.
- When unsure where code belongs, check the folder boundaries above. If none fits, ask.

## Decisions

Record all architectural decisions in `docs/decisions.md` using the format:

```
## D00X — YYYY-MM
One-line description of the decision.
```

## Quality checks

Run after every change:

- `npm run lint:fix` — ESLint auto-fix
- `npm run format` — Prettier formatting
- `npm run typecheck` — type-check with nuxt typecheck
- `npm run test:unit:ci` — unit tests (Vitest)

Git hooks enforce lint, format, typecheck, unit tests, and conventional commit messages automatically on commit.  
Allowed commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`, `build:`, `ci:`, `perf:`.

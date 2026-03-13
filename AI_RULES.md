# AI Rules

This repository is developed exclusively by LLMs.
Read this file before making any changes.

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

Wrong — barrel file re-exporting everything:

```ts
// app/notes/index.ts
export * from './types'
export * from './parser'
```

Right — import directly from the source file:

```ts
import type { Note } from '~/notes/types'
import { parseNote } from '~/notes/parser'
```

Wrong — generic utility folder:

```ts
// app/utils/strings.ts
export function capitalize(s: string) { ... }
```

Right — put the function where it is used, or in the domain folder it belongs to.

Wrong — Vue import inside domain logic:

```ts
// app/notes/noteService.ts
import { ref } from 'vue' // FORBIDDEN in domain folders
```

Right — domain logic stays pure; Vue reactivity belongs in composables:

```ts
// app/notes/noteService.ts
export function findNote(notes: Note[], id: string): Note | undefined {
  return notes.find((n) => n.id === id)
}

// app/composables/useNotes.ts
const notes = ref<Note[]>([])
```

Wrong — abstract base class:

```ts
abstract class BaseStorage { ... }
class BrowserStorage extends BaseStorage { ... }
```

Right — interface + direct implementation:

```ts
// app/storage/types.ts
export interface NoteStorage {
  loadNotes(): Promise<Note[]>
}

// app/storage/browser.ts
export const browserStorage: NoteStorage = { ... }
```

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
- `docs/` → architecture, decisions, workflow

Reserved (exist but not active yet):

- `desktop/tauri/` → Tauri desktop packaging
- `themes/tokens/` → theme token definitions

## Naming conventions

- Vue components: `PascalCase.vue` (e.g. `NoteList.vue`)
- Composables: `useXxx.ts` (e.g. `useNotes.ts`)
- Domain and storage files: `camelCase.ts` (e.g. `browser.ts`)
- Test files: `*.test.ts` (e.g. `notes.test.ts`)
- Import alias: `~/` from app root (e.g. `import { Note } from '~/notes/types'`)
- Use relative imports (`./`) within the same folder (e.g. `import { NoteStorage } from './types'`)
- `~/` and `@/` both resolve to `app/`. Use `~/` in all code. `@/` appears only in `components.json` for the shadcn-vue CLI.

## Theming

Theming uses CSS custom properties via Tailwind CSS and shadcn-vue.
Do not create a separate theme module or JS token objects.
Custom themes are CSS variable sets defined in `app/assets/css/`.
Theme selection logic belongs in `app/composables/`.

## Modification rules

- Put code in the most obvious existing folder.
- Folders listed in "Folder boundaries" above are approved. Create them when first needed.
- Do not create folders outside that list without explicit approval.
- Keep functions small and direct.
- Pure domain logic (`notes/`, `storage/`, `config/`) must not import from Vue.
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

## Workflow

See `docs/ai-development.md` for the step-by-step feature implementation workflow.

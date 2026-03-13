# AI Rules

This repository is developed exclusively by LLMs.
Read this file before making any changes.

## Project status

The Nuxt/Vue/Tailwind stack is not yet installed. The `app/` folder contains
illustrative domain and storage code that defines the architectural direction.
Initialize the stack before implementing features.

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
- `utils/`, `helpers/`, `shared/`, `lib/` folders
- `index.ts` barrel files
- abstract base classes

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

Other:
- `app/assets/css/` → stylesheets, theme CSS variables
- `tests/unit/` → domain logic tests
- `tests/acceptance/` → user-visible behavior tests
- `docs/` → architecture, decisions, workflow

## Naming conventions

- Vue components: `PascalCase.vue` (e.g. `NoteList.vue`)
- Composables: `useXxx.ts` (e.g. `useNotes.ts`)
- Domain and storage files: `camelCase.ts` (e.g. `browser.ts`)
- Test files: `*.test.ts` (e.g. `notes.test.ts`)
- Import alias: `~/` from app root (e.g. `import { Note } from '~/notes/types'`)

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
- Pure domain logic (`notes/`, `storage/`) must not import from Vue.
- When unsure where code belongs, check the folder boundaries above. If none fits, ask.

## Decisions

Record all architectural decisions in `docs/decisions.md` using the format:
```
## D00X — YYYY-MM
One-line description of the decision.
```

## Workflow

See `docs/ai-development.md` for the step-by-step feature implementation workflow.

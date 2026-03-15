# Architecture

For rules and conventions, see `AI_RULES.md` (the single source of truth).

## App structure

```
app/
├── components/      UI (Nuxt auto-imported)
│   └── ui/          shadcn-vue components (managed via CLI)
├── composables/     Vue logic/state (Nuxt auto-imported)
├── pages/           Routes (Nuxt auto-imported)
├── layouts/         Page layouts (Nuxt auto-imported)
├── assets/css/      Stylesheets, theme CSS variables
├── lib/utils.ts     shadcn-vue cn() utility
├── notes/           Domain logic (explicit imports)
├── storage/         Persistence (explicit imports)
└── config/          Configuration (explicit imports)
```

## Test structure

```
tests/
├── unit/            Domain logic tests
└── e2e/             End-to-end tests (Playwright)
```

## Feature specs

```
docs/features/
├── backlog.md       Ordered priority list
├── _template.md     Feature spec template
└── <slug>.md        One file per feature
```

See `docs/ai-development.md` for the workflow that uses these files.

## Domain model

### Note (`app/notes/types.ts`)

- `Note` — core entity: `id`, `title`, `content`, `metadata`.
- `NoteMetadata` — timestamps: `createdAt`, `updatedAt`.

### Storage (`app/storage/types.ts`, `app/storage/browser.ts`)

- `NoteStorage` — interface with `loadNotes()`, `saveNote(note)`, `deleteNote(id)`.
- `browserStorage` — `NoteStorage` implementation using `localStorage`.

### Config (`app/config/loader.ts`, `app/config/default.yaml`)

- `AppConfig` — typed configuration: `features.metadata`, `layout.showSidebar`, `layout.showNoteList`.
- `loadConfig()` — parses the YAML default config into `AppConfig`.

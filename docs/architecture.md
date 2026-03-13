# Architecture

For rules and conventions, see `AI_RULES.md` (the single source of truth).

## App structure

```
app/
├── components/      UI (Nuxt auto-imported)
├── composables/     Vue logic/state (Nuxt auto-imported)
├── pages/           Routes (Nuxt auto-imported)
├── layouts/         Page layouts (Nuxt auto-imported)
├── assets/css/      Stylesheets, theme CSS variables
├── notes/           Domain logic (explicit imports)
├── storage/         Persistence (explicit imports)
└── config/          Configuration (explicit imports)
```

## Test structure

```
tests/
├── unit/            Domain logic tests
└── acceptance/      User-visible behavior tests
```

## Nuxt auto-import boundary

Nuxt auto-imports from `components/`, `composables/`, `pages/`, `layouts/`.
All other app folders require explicit imports using the `~/` alias.

## Intended UI layout

- Sidebar
- NoteList
- Editor
- Inspector (metadata)
- Toolbar
- Modals

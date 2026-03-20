# Architecture

For rules and conventions, see `AI_RULES.md` (the single source of truth).
For canonical terminology, see `docs/ubiquitous-language.md`.

## Overview

The data model is derived from the canonical storage format: one Markdown
file per note with YAML frontmatter.

A Note is an in-memory object whose user-defined Properties are top-level
fields (values may be scalars, arrays, or nested objects). Composed of three
parts:

- **System Properties** — read-only values provided by the storage adapter:
  `id` (string), `createdAt` (ISO 8601 string), `modifiedAt` (ISO 8601 string).
- **Properties** — user-defined data, unique per note. In memory these live as
  top-level note fields; values may be scalars, arrays, or nested objects. In
  storage they are serialized as YAML frontmatter.
- **Content** — rich text stored in the `content` field (Markdown with Liquid
  templating tags).

`id` is always a string. On desktop (filesystem storage) it equals the file
path within the Vault. On cloud (database storage) it is a database record
identifier.

## Current implementation

- `app/notes/types.ts` — flat `Note` type (`id`, user-defined properties,
  `content`, `createdAt`, `modifiedAt`).
- `app/storage/types.ts` — `NoteStorage` adapter boundary with separate
  properties and content save inputs.
- `app/storage/browser.ts` — browser localStorage adapter storing Markdown
  documents with YAML frontmatter plus timestamps.
- `app/storage/filesystem.ts` — filesystem adapter storing notes as Markdown
  files with YAML frontmatter in a configurable vault directory. Timestamps
  derived from file stats. Notes loaded in mtime-descending order.
- `app/storage/router.ts` — active storage selection from `applicationType`.
- `app/config/loader.ts` — typed `AppConfig` parsed from `app/config/default.yaml`.
- `app/pages/index.vue` — placeholder page.

## Bounded contexts

- `Note Authoring` — content editing, properties editing, template behavior,
  custom content blocks
- `Workspace Catalog` — folders, note list, selection, filters, search
- `Note Storage` — the canonical storage contract plus backend adapters
- `Configuration` — feature flags, layout config, storage configuration

Context-to-folder mapping:

| Context                           | Domain logic   | UI state           |
| --------------------------------- | -------------- | ------------------ |
| Note Authoring, Workspace Catalog | `app/notes/`   | `app/composables/` |
| Note Storage                      | `app/storage/` | —                  |
| Configuration                     | `app/config/`  | `app/composables/` |

New contexts may be introduced when corresponding features are specified.

## Editor architecture

- Tiptap owns the entire note content section as one document.
- Templates wrap content to provide rendered page context. Liquid and layout
  code lives outside Tiptap. Templates are not edited inline.
- Custom Liquid-compatible content blocks are implemented through custom Tiptap
  extensions and nodes. Blocks that have no interactive editing render as
  non-editable nodes.
- Properties are edited separately in the Inspector, not inside the editor.
- In filesystem-backed storage, properties are serialized as YAML frontmatter.

## Filesystem representation

- One Markdown file per note.
- `id` equals the note path within the Vault.
- Markdown body stores Content. YAML frontmatter stores Properties.
- The Vault (storage root directory) is user-configurable.

## Storage (`app/storage/`)

- `NoteStorage` — adapter boundary for loading and saving logical note
  documents while hiding backend-specific serialization details.
- `app/storage/router.ts` selects the active `NoteStorage` from configuration.
- The active storage adapter is determined by `applicationType` in
  `app/config/default.yaml`: `desktop` → filesystem adapter (default),
  `browser` → browser localStorage adapter, `cloud` → database adapter.
- Browser localStorage stores one Markdown document plus storage-owned
  timestamps per note.
- Expected adapters: filesystem (desktop), browser, cloud.
- Adapter-specific caches or indexes are derived artifacts, never the source of
  truth.

## State management

The app must support multi-user cloud deployment where SSR serves
concurrent requests. Module-scope state leaks across requests.

- Use Nuxt `useState()` for all shared reactive state in composables.
- Do not use module-scope `ref()` or `reactive()` for shared state.
- Do not use Pinia.

## Error handling

- Validate external inputs at boundaries (storage reads, config parsing,
  user input). Domain logic may assume valid data.

## Config (`app/config/`)

- `AppConfig` — typed configuration covering layout, theming, feature flags,
  and storage settings.
- `loadConfig()` — parses the YAML default config into `AppConfig`.
- `app/config/default.yaml` provides initial default values. Runtime
  configuration state (e.g. panel visibility toggles) lives in composables
  initialized from these defaults.

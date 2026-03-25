# Architecture

For rules and conventions, see `AGENTS.md` (the single source of truth).
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
- `app/composables/useLayout.ts` — layout panel visibility state initialized
  from config defaults.
- `app/layouts/default.vue` — application shell composing SidebarPanel, NotesListPanel,
  page slot, and InspectorPanel in a horizontal flexbox.
- `app/pages/index.vue` — renders `NotePanel`.
- `SidebarPanel` (`app/components/SidebarPanel.vue`) — sidebar shell.
  - `SidebarNavigation` (`app/components/SidebarNavigation.vue`) — view-selection
    navigation (for example `All Notes`, `Favorites`).
- `NotesListPanel` (`app/components/NotesListPanel.vue`) — notes list shell.
  - `NotesListControls` (`app/components/NotesListControls.vue`) — within-view
    filtering and refinement controls.
    - `NotesListActions` (`app/components/NotesListActions.vue`) — list-scoped
      actions (for example create note).
  - `NotesList` (`app/components/NotesList.vue`) — scrollable note list.
- `NotePanel` (`app/components/NotePanel.vue`) — active note region.
  - `NoteControls` — note toolbar region.
    - `NoteActions` — note-scoped actions (for example favorite, delete).
  - `NoteView` (`app/components/NoteView.vue`) — bounded note display and
    editing region.
    - `NoteTemplate` — template (Liquid) output wrapper.
      - `NoteTitle` — active note title displayed above the editor surface.
      - `NoteEditor` — content editing surface.
- `InspectorPanel` (`app/components/InspectorPanel.vue`) — inspector shell.
  - `InspectorNavigation` (`app/components/InspectorNavigation.vue`) — tab bar
    for inspector views.
  - `InspectorContent` (`app/components/InspectorContent.vue`) — active view
    container.
    - `InspectorPropertiesView`
      (`app/components/InspectorPropertiesView.vue`) — properties editor.
      - `InspectorPropertiesList`
        (`app/components/InspectorPropertiesList.vue`) — property key-value
        list.

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

- The editor owns the entire note content section as one document.
- `NoteEditor` uses Editor.js as the client-side editing surface.
- Markdown remains the canonical Content format; the UI converts between
  Markdown and Editor.js blocks in the browser.
- Templates wrap content to provide rendered page context. Liquid and layout
  code lives outside the editor. Templates are not edited inline.
- Properties are edited separately in the InspectorPanel, not inside the editor.
- In filesystem-backed storage, properties are serialized as YAML frontmatter.
- `useNotes()` owns the active note id in shared state. After a successful load,
  it selects the first loaded note by default and `NoteTemplate` passes that
  note's title into `NoteTitle` and its Content into `NoteEditor`.
- Renaming a note title changes the note `id` by replacing its basename with the
  edited title plus `.md`, while keeping the parent folder unchanged. On
  collisions, storage selects a unique suffixed filename.

## UI interaction patterns

- Actions are scoped to their parent context: `NoteActions` operates on the
  active note, while `NotesListActions` operates on the list as a whole.
- Filtering happens in two levels: `SidebarNavigation` selects the view (the
  broad note set), then `NotesListControls` refines that view. `NotesList`
  renders the resulting set.
- Property mutation is an in-memory concern. Persistence is a separate
  cross-cutting concern and should not be part of an individual feature spec
  unless the feature introduces new persistence behavior.

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

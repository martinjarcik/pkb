# Architecture

For rules and conventions, see `AGENTS.md` (the single source of truth).
For canonical terminology, see `docs/ubiquitous-language.md`.

## Overview

The data model is derived from the canonical storage format: one Markdown
file per note with YAML frontmatter.

A Note is an in-memory object whose Properties and Application Properties are
top-level fields (values may be scalars, arrays, or nested objects). Composed of
five parts:

- **System Properties** — read-only values provided by the storage adapter:
  `id` (string), `createdAt` (ISO 8601 string), `modifiedAt` (ISO 8601 string).
  Never serialized to frontmatter.
- **Derived Properties** — application-computed per-note fields that exist only
  in memory: `title` (string, derived from the `id` basename) and `description`
  (string, a 120-character stripped-markdown preview derived from Content).
  Never serialized to frontmatter. Recomputed at note load and on save/rename.
  They shadow any user-defined Properties with the same key names (see D011).
- **Application Properties** — application-managed per-note state (e.g.
  `hasTasks`). Controlled through dedicated UI, not editable in the property
  editor. In memory these are flat top-level Note fields. On disk they are
  serialized under the `app` namespace key in YAML frontmatter (see D009).
- **Properties** — user-defined data, unique per note. In memory these live as
  top-level note fields; values may be scalars, arrays, or nested objects. On
  disk they are serialized as top-level YAML frontmatter keys. The `tags`
  property is derived from inline hashtags in Content, but persisted here as a
  top-level user Property.
- **Content** — rich text stored in the `content` field (Markdown with Liquid
  templating tags).

`id` is always a string. With filesystem storage it equals the file path within
the Vault.

A Note catalog row is the Workspace Catalog projection of a Note. It keeps the
same top-level fields except `content`, which is omitted from the list-facing
shape because the app now keeps full note bodies in shared client state.

## Current implementation

- `app/notes/types.ts` — flat `Note` type plus `Note catalog row` for the
  Workspace Catalog payload shape.
- `app/storage/types.ts` — `NoteStorage` adapter boundary with eager full-note
  loading plus note/folder mutation methods.
- `app/storage/filesystemProxy.ts` — filesystem storage adapter backed by the
  current `PlatformApi` implementation. It loads all Markdown notes with full
  content on startup, then reuses the shared document serializer/parser for
  writes.
- `app/storage/platformApi.ts` — raw I/O contract for note files,
  scoped config/meta text files, and vault assets.
- `app/storage/tauriPlatformApi.ts` — desktop `PlatformApi` implementation
  using Tauri IPC commands plus desktop asset URLs for note images.
- `app/storage/router.ts` — active storage selection from `storageType`.
- `app/config/loader.ts` — typed `AppConfig` parsed from `app/config/default.yaml`,
  including the active locale, theme settings, and `notes.trashRetentionDays`.
- `app/AppRoot.vue` — desktop app shell that applies the configured accent color
  CSS variable, starts the app, and composes the three-panel workspace layout.
- `app/main.ts` — plain Vue desktop entry that mounts `AppRoot.vue`.
- `vite.config.ts` — build and alias configuration for the plain Vue frontend.
- `app/composables/useLayout.ts` — layout panel visibility state initialized
  from config defaults, plus session-only non-distraction mode (snapshot and
  restore of the three panel flags).
- `app/composables/useSidebarNavigation.ts` — sidebar view state initialized
  from config defaults, including the Inbox, Tasks, Favorites (when
  `features.favorites` is true), Trashed, top-level folder note filters, and
  tag-based note filtering.
- `desktop/tauri/` — Tauri desktop host and Rust IPC commands for filesystem,
  scoped config/meta, folder, and asset operations.
- `SidebarPanel` (`app/components/SidebarPanel.vue`) — sidebar shell.
  - `SidebarNavigation` (`app/components/SidebarNavigation.vue`) — view-selection
    navigation.
    - `SidebarNavigationItem`
      (`app/components/SidebarNavigationItem.vue`) — individual sidebar view item
      (for example `Inbox`).
  - `SidebarFolders` (`app/components/SidebarFolders.vue`) — folders section
    wrapper with header, collapsible folder list, and the folder create/edit
    dialog (`FolderDialog.vue`).
    - `SidebarFoldersControls`
      (`app/components/SidebarFoldersControls.vue`) — folders header with
      hover-reveal "create folder" and "collapse/expand" controls.
    - `SidebarFoldersActions`
      (`app/components/SidebarFoldersActions.vue`) — top-level Vault folder list.
      - `SidebarFolderItem`
        (`app/components/SidebarFolderItem.vue`) — individual folder view item
        (hover-reveal edit control, optional emoji icon from workspace meta).
  - `SidebarTags` (`app/components/SidebarTags.vue`) — tag filter section.
    - `SidebarTagsControls`
      (`app/components/SidebarTagsControls.vue`) — tag section header.
    - `SidebarTagsList`
      (`app/components/SidebarTagsList.vue`) — available tags for filtering.
      - `SidebarTagItem`
        (`app/components/SidebarTagItem.vue`) — individual clickable tag chip.
- `NotesListPanel` (`app/components/NotesListPanel.vue`) — notes list shell.
  - `NotesListControls` (`app/components/NotesListControls.vue`) — within-view
    filtering and refinement controls.
    - `NotesListActions` (`app/components/NotesListActions.vue`) — list-scoped
      actions (for example create note and the layout/settings menu).
      - `SettingsDialog` (`app/components/SettingsDialog.vue`) — app settings
        dialog opened from the NotesListActions menu.
  - `NotesList` (`app/components/NotesList.vue`) — scrollable note list.
- `NotePanel` (`app/components/NotePanel.vue`) — active note region.
  - `NoteControls` (`app/components/NoteControls.vue`) — note toolbar region
    with note-scoped actions (for example favorite toggle when enabled, pin
    toggle, non-distraction mode, webhook URL dialog, delete).
  - `NoteTemplate` (`app/components/NoteTemplate.vue`) — template (Liquid)
    output wrapper; narrows and centers the editor column when
    non-distraction mode is active.
    - `NoteEditor` — content editing surface (includes an EditorJS `noteTitle`
      block pinned at index 0 for inline title editing and an inline hashtag
      formatting tool).
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
`app/notes/sidebarFilters.ts` stays in domain logic intentionally: it models
workspace-view filtering and ordering as pure TypeScript, while
`app/composables/useSidebarNavigation.ts` owns the reactive UI state that uses
those rules.

## Editor architecture

- The editor owns the entire note content section as one document.
- `NoteEditor` uses Editor.js as the client-side editing surface.
- Markdown remains the canonical Content format; the UI converts between
  Markdown and Editor.js blocks in the browser.
- On save, the app extracts inline hashtags from Markdown Content and persists
  them as the top-level `tags` Property while keeping the visible Content text
  unchanged. It also recomputes the `hasTasks` Application Property from
  unchecked markdown checklist items.
- Templates wrap content to provide rendered page context. Liquid and layout
  code lives outside the editor. Templates are not edited inline.
- Properties are edited separately in the InspectorPanel, not inside the editor.
- In filesystem-backed storage, properties are serialized as YAML frontmatter.
- `useNotes()` owns the full in-memory note store, the derived note catalog, the
  active note id, and the selected full note in shared state. The page selects
  the initial note after load; `NoteTemplate` passes the selected note's title
  and Content into `NoteEditor`.
- After save and trash operations, the client may POST to the note’s `webhook`
  Application Property (HTTPS URL only) with a JSON body `{ event, note }`
  where `event` is `updated` or `deleted`. Delivery is best-effort and does not
  affect persistence.
- `useSidebarNavigation()` owns the active sidebar view in shared state.
  The default `Inbox` view filters `NotesList` to notes whose `id` lives at the
  vault root. The `Favorites` view (when enabled in config) filters across the
  whole catalog to notes whose `favorite` Application Property is `true`,
  excluding trashed notes. The `Tasks` view filters across the whole catalog to
  notes whose `hasTasks` Application Property is `true`, while folder views filter to notes
  that are direct children of a selected top-level Vault folder. Tag views
  filter across the whole catalog to notes whose `tags` Property contains all
  active and pinned Tags (AND logic). Each Tag has a tri-state filter cycle
  (idle -> active -> pinned -> idle): at most one Tag can be active; pinned
  Tags survive further clicks. For any sidebar view, the visible notes list
  orders rows with the `pinned` Application Property `true` first, then by
  `modifiedAt` descending among pinned and among non-pinned groups.
- Renaming a note title changes the note `id` by replacing its basename with the
  edited title plus `.md`, while keeping the parent folder unchanged. On
  collisions, storage selects a unique suffixed filename.

### Editor lifecycle contracts

- `NoteEditor.vue` applies `patchExecCommandForInlineHighlight()` during
  mount so inline highlight operations stay in sync with autosave. It must call
  `restoreExecCommand()` during `onBeforeUnmount`.
- `BigEmojiTool` registers a capture-phase `mousedown` listener on `document`
  in its constructor. Cleanup happens through the Editor.js tool `destroy()`
  path when `NoteEditor` destroys the editor instance on unmount.
- `useEditorSync()` owns the pending autosave timer. `NoteEditor.vue`
  must call `clearPendingContentSync()` during prop-driven re-renders and
  before unmount.
- `useEditorTitleRepair()` uses an `isRepairingTitleBlock` guard to prevent
  re-entrant title-block normalization while Editor.js change callbacks are in
  flight.

## UI interaction patterns

- Actions are scoped to their parent context: `NoteControls` operates on the
  active note, while `NotesListActions` operates on the list as a whole.
  Creating a note uses the active sidebar view to choose the parent path.
- `NotesListActions` currently owns both note creation and layout visibility
  toggles. Keep that pairing explicit unless the toolbar grows enough to need a
  dedicated split.
- Filtering happens in two levels: `SidebarNavigation` selects the view (the
  broad note set), then `NotesListControls` refines that view. `NotesList`
  renders the resulting set.
- The default `Inbox` sidebar view narrows the broad note set to notes whose
  `id` contains no `/`, which corresponds to notes stored directly in the
  Vault root.
- The `Favorites` sidebar view (when enabled in config) narrows the broad note
  set to notes whose `favorite` Application Property is `true`, excluding trashed
  notes.
- The `Tasks` sidebar view narrows the broad note set to notes whose
  `hasTasks` Application Property is `true`, regardless of folder.
- Folder sidebar views narrow the broad note set to notes whose `id` has the
  shape `<topLevelFolder>/<note>.md`, excluding deeper descendants.
- Tag sidebar views narrow the broad note set to notes whose `tags` Property
  contains every active or pinned Tag. Tags cycle through idle, active, and
  pinned states on click. Switching to Inbox or a folder clears all tag states.
- Property mutation is an in-memory concern. Persistence is a separate
  cross-cutting concern and should not be part of an individual feature spec
  unless the feature introduces new persistence behavior.

## Filesystem representation

- One Markdown file per note.
- `id` equals the note path within the Vault.
- Markdown body stores Content. YAML frontmatter stores Properties and
  Application Properties.
- User-defined Properties are top-level frontmatter keys. Application Properties
  are nested under the `app` key:

  ```yaml
  ---
  app:
    hasTasks: true
  tags: [cooking]
  rating: 5
  ---
  Note content here.
  ```

- The Vault (storage root directory) is user-configurable.

On desktop, the filesystem adapter reflects whatever is on disk at read and
write time. There is no watcher, merge layer, or conflict resolution for
edits made outside the process. Treat in-app state as authoritative during a
session; external changes are an unsupported interaction pattern and may
produce stale views, failed saves, or overwritten files.

## Storage (`app/storage/`)

- `NoteStorage` — adapter boundary for loading Workspace Catalog rows, loading
  full logical note documents by id, saving logical note documents, creating
  folders, and loading folder names, while hiding backend-specific
  serialization details.
- `PlatformApi` — desktop-only raw I/O boundary under `NoteStorage` and config
  persistence. The current implementation uses Tauri IPC without changing the
  app-level storage or editor contracts.
- `app/storage/router.ts` selects the active `NoteStorage` from configuration.
- The active storage adapter is determined by `storageType` in
  `app/config/default.yaml`: `filesystem` → filesystem adapter (default),
  `database` → reserved for future remote database adapter.
- Expected adapters: filesystem (current), database (future).
- Adapter-specific caches or indexes are derived artifacts, never the source of
  truth.

## State management

The app runs as a single-process desktop SPA, so shared state is held in
module-scope Vue refs owned only by `useAppConfigDisk()`, `useFolderMeta()`,
`useLayout()`, `useNotes()`, `useSettings()`, and `useSidebarNavigation()`.

- Other composables must receive shared refs through arguments or consume those
  state-owning composables.
- Do not create duplicate shared state owners.
- Do not use Pinia.

## Error handling

- Validate external inputs at boundaries (storage reads, config parsing,
  user input). Domain logic may assume valid data.

## Config (`app/config/`)

- `AppConfig` — typed configuration covering layout, theming, localization,
  feature flags, and storage settings.
- `loadConfig()` — parses the YAML default config into `AppConfig`.
- `app/config/default.yaml` provides initial default values. Runtime
  configuration state (e.g. panel visibility toggles) lives in composables
  initialized from these defaults.
- `WorkspaceMeta` (`app/config/parseMeta.ts`) — typed workspace metadata (for
  example per-folder emoji icons), persisted in `meta.yaml` in the desktop app
  data directory. Loaded and updated through the client-side persistence layer backed by
  the `PlatformApi`; `useFolderMeta()` holds reactive folder metadata in shared
  Vue refs.

### Config sources in the running app

- Disk-backed config (`useAppConfigDisk()`) is loaded on startup from the
  client-side persistence layer and drives runtime settings in the app shell,
  including `locale`, `features.*`, `notes.trashRetentionDays`,
  `editor.autosaveDelay`, `editor.assetsFolder`, `layout.*`,
  `theme.accentColor`, `theme.defaultEditorColor`, and `editorColors`.
- Bundled defaults from `loadConfig()` provide the initial in-memory fallback
  before disk load succeeds and remain the validation baseline for missing
  scoped files.
- Runtime config/meta writes are orchestrated in the client and persisted via
  the `PlatformApi`. Both `app-config.yaml` and `meta.yaml` live in the desktop
  app data directory.

## Common change chains

- Adding an Application Property:
  update `APPLICATION_PROPERTY_KEYS` and the explicit optional fields in
  `app/notes/types.ts`, handle frontmatter mapping in `app/storage/document.ts`,
  update the affected domain logic in `app/notes/`, expose the behavior through
  the relevant composable, and update `docs/ubiquitous-language.md` if the
  term is user-visible.
- Adding an Editor.js block type:
  implement the tool in `app/lib/`, register it in
  `app/lib/editorjsToolsConfig.ts`, add conversion support in
  `app/lib/markdownToBlocks.ts` and `app/lib/blocksToMarkdown.ts`, then cover
  the behavior with an end-to-end test.
- Changing hashtag matching:
  keep `app/notes/extractTags.ts`, `app/lib/markdownToBlocks.ts`, and
  `app/lib/editorjsHashtagHighlight.ts` aligned. The shared
  `createHashtagPattern()` helper in `app/notes/extractTags.ts` exists to keep
  those three paths consistent.

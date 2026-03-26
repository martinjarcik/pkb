# Product Manual

## Application Layout

- **SidebarPanel** (left) — navigation and app-level actions.
- **SidebarNavigation** (inside SidebarPanel) — starts in the `Inbox` view and
  highlights the selected item with `theme.accentColor`.
- **SidebarFoldersActions** (inside SidebarPanel, below SidebarNavigation) —
  lists top-level Vault folders as selectable rows below a 30 px spacer.
- **NotesListPanel** (left panel) — lists all notes, allows selecting one.
- **NotePanel** (center) — hosts the main note area and fills the remaining
  space.
- **InspectorPanel** (right panel) — shows and edits the selected note's properties.

Default visibility of the sidebar, note list, and inspector is set in
`app/config/default.yaml`. The UI can override these values at runtime.

When the application opens on the default route, the frontend loads the note
catalog from `GET /api/notes`, selects the `Inbox` sidebar item, and renders
only notes from the vault root in `NotesListPanel`. Each catalog row includes
the note title derived from its `id`, the modified date, and only the first
1024 UTF-8 bytes of Content for the list preview.

After notes load, the first visible note in the active sidebar view becomes the
active note automatically and is highlighted in `NotesListPanel`. When a note
becomes active, the frontend fetches the full note from `GET /api/notes/<id>`
before rendering that note in the `NotePanel`, including the note title above
the Editor.js surface.

The notes list toolbar includes a create-note action. Clicking it creates a new
note titled `New Note` (or the next available suffixed variant such as
`New Note (2)`), places that note at the top of `NotesListPanel`, selects it,
and focuses the title for immediate renaming. The note is created in the
currently selected sidebar view: `Inbox` creates it in the vault root, while a
selected folder creates it directly in that folder.

## Configuration

| Key                         | Type    | Default       | Description                                        |
| --------------------------- | ------- | ------------- | -------------------------------------------------- |
| `applicationType`           | string  | `"desktop"`   | Application mode: `browser`, `desktop`, `cloud`    |
| `locale`                    | string  | `"en"`        | Active application locale                          |
| `vault`                     | string  | `"./vault"`   | Path to the vault directory for desktop storage    |
| `editor.autosaveDelay`      | number  | `2000`        | Milliseconds of idle time before content autosaves |
| `layout.showInspectorPanel` | boolean | `true`        | Show the InspectorPanel                            |
| `layout.showSidebarPanel`   | boolean | `true`        | Show the SidebarPanel                              |
| `layout.showNotesListPanel` | boolean | `true`        | Show the NotesListPanel                            |
| `theme.accentColor`         | string  | `"#3f57dfff"` | Accent color used for the selected Inbox item      |

## Features

### Filesystem Storage (desktop)

When `applicationType` is `desktop`, notes are stored as Markdown files in the
configured `vault` directory. Each note is one `.md` file. The note `id` equals
the file path relative to the vault root.

- Properties are serialized as YAML frontmatter.
- Content is the Markdown body after the frontmatter.
- `createdAt` and `modifiedAt` are derived from file system timestamps.
- Notes are loaded in most-recently-modified-first order.
- The vault path is set in `app/config/default.yaml` (default: `./vault`).
- The frontend loads a lightweight note catalog on app open and displays it in
  `NotesListPanel`.
- The full note body is fetched separately when a note is selected.

#### Primary editor and files on disk

This application is the **primary** editor for notes: normal authoring, renaming,
and saving happen here. Notes still live as ordinary files under the Vault so
users can copy, back up, reorganize, or inspect them with any tool they prefer.

The product does **not** aim to reconcile concurrent edits made outside the app
while it is running. If someone changes or deletes vault files behind the
running session, the UI may show stale content until reload, autosave may
overwrite external changes, or errors may appear when paths no longer match the
loaded catalog. Managing that risk is the user’s responsibility, not a feature
of the app.

### Inbox View

The default sidebar view is `Inbox`.

- `Inbox` shows only notes whose `id` has no `/`, which means the note is
  stored directly in the vault root.
- Notes stored in subdirectories are excluded from the Inbox list.
- The selected Inbox item uses `theme.accentColor` from
  `app/config/default.yaml`.

### Vault Folder Views

Top-level Vault folders appear below `Inbox` in `SidebarPanel`.

- Each folder row is inferred from the first path segment of loaded note `id`
  values such as `Work/note.md`.
- Selecting a folder shows only notes stored directly in that folder.
  Nested notes such as `Work/archive/note.md` remain excluded.
- Folder rows use the same selected styling as `Inbox`.
- When a folder is selected, the first visible note in that folder becomes the
  active note automatically.

### Browser Storage

When `applicationType` is `browser`, notes are stored in the browser's
localStorage as JSON-serialized Markdown documents with YAML frontmatter.

### Note Editor

The note content area uses Editor.js as the editing surface.

- Creating a note opens it immediately and moves keyboard focus to the note
  title editing area so the title can be changed inline.
- The selected note title is displayed above the editor surface inside the
  template area.
- Clicking the title lets the user edit it inline. Pressing Enter or clicking
  outside saves the title by renaming the note filename to `<NoteTitle>.md`
  within the same folder. If that filename already exists, the app uses a
  unique suffixed filename.
- Markdown remains the canonical note Content format.
- The frontend translates between Markdown and Editor.js blocks in the browser.
- Content autosaves after `editor.autosaveDelay` milliseconds of editor idle time (default 2000 ms).
- Switching to a different note flushes any pending autosave before selection changes.

### Internationalization

The application uses `@nuxtjs/i18n` for UI translations.

- English (`en`) is the default and currently the only bundled locale.
- The active locale is selected through `app/config/default.yaml` via the `locale` key.
- User-facing UI strings and Editor.js labels are sourced from `app/locales/en.json`.
- Adding another language requires a new locale file, a matching entry in `nuxt.config.ts`, and an updated config value.

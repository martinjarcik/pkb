# Product Manual

## Application Layout

- **SidebarPanel** (left) — navigation and app-level actions.
- **SidebarNavigation** (inside SidebarPanel) — starts in the `Inbox` view and
  highlights the selected item with `theme.accentColor`. When
  `features.favorites` is true in config, a `Favorites` item lists notes with the
  `favorite` application property (non-trashed only).
- **SidebarFoldersActions** (inside SidebarPanel, below SidebarNavigation) —
  lists top-level Vault folders as selectable rows below a 30 px spacer.
- **SidebarTags** (inside SidebarPanel, below SidebarFoldersActions) — lists all
  available tags as clickable chips below a 30 px spacer.
- **NotesListPanel** (left panel) — lists all notes, allows selecting one.
  Notes with the `pinned` Application Property sort to the top of the current
  sidebar view and use a light accent-tinted row background when not selected.
- **NotePanel** (center) — hosts the main note area and fills the remaining
  space. `NoteControls` above the editor includes a favorite toggle (when
  enabled in config), a pin toggle, non-distraction mode (hides the sidebar,
  notes list, and inspector until toggled off; accent-colored icon while
  active; note editor area is half width and centered), a webhook control (dialog for the optional HTTPS `webhook`
  Application Property; accent-colored icon when set), and delete. Pin sets the
  `pinned` Application Property; active pin, favorite, non-distraction, and
  set-webhook icon states use `theme.accentColor`.
- **InspectorPanel** (right panel) — shows and edits the selected note's properties.

Default visibility of the sidebar, note list, and inspector is set in
`app/config/default.yaml`. The UI can override these values at runtime.

When the application opens on the default route, the frontend loads the note
catalog from `GET /api/notes`, selects the `Inbox` sidebar item, and renders
only notes from the vault root in `NotesListPanel`. Each catalog row includes
the note title derived from its `id`, the modified date, and only the first
1024 UTF-8 bytes of Content for the list preview.

After notes load, the first note in the Inbox view becomes the active note
automatically and is highlighted in `NotesListPanel`. When a note
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

| Key                         | Type    | Default       | Description                                                                     |
| --------------------------- | ------- | ------------- | ------------------------------------------------------------------------------- |
| `applicationType`           | string  | `"desktop"`   | Application mode: `browser`, `desktop`, `cloud`                                 |
| `locale`                    | string  | `"en"`        | Active application locale                                                       |
| `vault`                     | string  | `"./vault"`   | Path to the vault directory for desktop storage                                 |
| `editor.autosaveDelay`      | number  | `2000`        | Milliseconds of idle time before content autosaves                              |
| `editor.assetsFolder`       | string  | `"assets"`    | Top-level vault folder for uploaded note images (not shown as a sidebar folder) |
| `layout.showInspectorPanel` | boolean | `true`        | Show the InspectorPanel                                                         |
| `layout.showSidebarPanel`   | boolean | `true`        | Show the SidebarPanel                                                           |
| `layout.showNotesListPanel` | boolean | `true`        | Show the NotesListPanel                                                         |
| `theme.accentColor`         | string  | `"#3f57dfff"` | Accent color for selected nav, pinned note icon, and list tint                  |

Workspace metadata (folder icons, etc.) is stored in `meta.yaml` (see Vault
Folder Views), not in `app/config/default.yaml`.

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

#### Images in notes (desktop)

- The note editor includes an **Image** block (`@editorjs/image`). Uploads are
  stored as files under `{vault}/{editor.assetsFolder}/` (default folder name
  `assets`).
- Saved note Content stores standard Markdown image syntax with a vault-relative
  path, for example `![](assets/<filename>.png)`.
- The app serves those files at `GET /api/vault-assets/<path>` so the editor can
  display them. Upload is available only when `applicationType` is `desktop`.
- The configured `editor.assetsFolder` name is **not** listed as a Vault
  folder row in the sidebar (even if the directory exists on disk).

### Inbox View

The default sidebar view is `Inbox`.

- `Inbox` shows only notes whose `id` has no `/`, which means the note is
  stored directly in the vault root.
- Notes stored in subdirectories are excluded from the Inbox list.
- The selected Inbox item uses `theme.accentColor` from
  `app/config/default.yaml`.

### Tasks View

The sidebar navigation includes a `Tasks` item alongside `Inbox`.

- `Tasks` shows notes whose `hasTasks` Application Property is `true`.
- `hasTasks` is recomputed on save from unchecked markdown checklist items such
  as `- [ ] Buy milk`.
- The `Tasks` view filters across the whole catalog, not just the vault root.
- The selected Tasks item uses the same accent styling as `Inbox`.

### Vault Folder Views

Top-level Vault folders appear below `Inbox` in `SidebarPanel`.

- Each folder row is inferred from the first path segment of loaded note `id`
  values such as `Work/note.md`.
- Selecting a folder shows only notes stored directly in that folder.
  Nested notes such as `Work/archive/note.md` remain excluded.
- Folder rows use the same selected styling as `Inbox`.
- When a folder is selected, the first visible note in that folder becomes the
  active note automatically.
- Optional **folder metadata** (currently an emoji icon) is stored in workspace
  `meta.yaml` at the project root by default. Use the **+** control in the
  Folders header to create a folder and pick an emoji, or hover a folder row and
  click the pencil to edit the icon. The name field is read-only when editing;
  clearing the icon restores the default folder glyph. Override the file
  location with the `PKB_META_PATH` environment variable.

### Tag Views

The sidebar tag section lists all unique `tags` values found in the loaded note
catalog.

- Tags are displayed with the `#` prefix in the sidebar, for example
  `#engineering`.
- Each tag has three states: **idle** (default), **active** (selected), and
  **pinned** (locked).
- Clicking an idle tag activates it and switches the notes list into a tag
  filter view. Any previously active (non-pinned) tag becomes idle.
- Clicking an active tag promotes it to pinned. Pinned tags stay selected when
  other tags are clicked.
- Clicking a pinned tag removes it from the filter (returns to idle).
- At most one tag can be active at a time. Multiple tags can be pinned.
- Active and pinned tags use the accent color on the tag text. Pinned tags are
  additionally displayed in bold.
- The notes list filters to notes matching all active and pinned tags using AND
  logic.
- When no tags remain active or pinned, the view falls back to Inbox.
- Clicking `Inbox` or a folder row clears all tag states to idle.

### Note webhooks

- From `NoteControls`, the webhook icon opens a dialog where you can paste an
  **HTTPS** URL or clear it. The value is stored as the `webhook` Application
  Property (under `app` in frontmatter).
- When a note with a webhook URL is saved, or after it is moved to trash from
  the toolbar, the server sends a single POST request to that URL with JSON
  `{ "event": "updated" | "deleted", "note": <full note object> }`. Failed
  deliveries do not block saving or trashing.

### Browser Storage

When `applicationType` is `browser`, notes are stored in the browser's
localStorage as JSON-serialized Markdown documents with YAML frontmatter.

- Application Properties such as `hasTasks` are serialized under the `app`
  frontmatter namespace and loaded back as flat top-level note fields in memory.

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
- Content autosaves after `editor.autosaveDelay` milliseconds of editor idle
  time (default 2000 ms).
- Switching to a different note flushes any pending autosave before selection changes.
- On save, inline hashtags such as `#engineering` are extracted into the
  top-level `tags` frontmatter property and remain visible in the note content.
- On save, unchecked markdown checklist items cause the `hasTasks` Application
  Property to be stored under the `app` frontmatter namespace.
- The inline toolbar includes a `Highlight` tool for marked text. Clicking it
  wraps the current selection in a yellow highlight by default. Hovering the
  highlight item opens color choices: red, green, yellow, blue, orange,
  purple, grey, and brown.
- Highlighted text is stored in Markdown as `==text==` for the default yellow
  highlight, or `==<emoji>text==` for non-default colors such as
  `==🔴important==`.
- The inline toolbar includes an `Inline Hashtag` tool for visually highlighting
  selected hashtag text inside the editor.

### Internationalization

The application uses `@nuxtjs/i18n` for UI translations.

- English (`en`) is the default and currently the only bundled locale.
- The active locale is selected through `app/config/default.yaml` via the `locale` key.
- User-facing UI strings and Editor.js labels are sourced from `app/locales/en.json`.
- Adding another language requires a new locale file, a matching entry in `nuxt.config.ts`, and an updated config value.

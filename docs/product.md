# Product Manual

## Application Layout

- **SidebarPanel** (left) — navigation and app-level actions.
- **NotesListPanel** (left panel) — lists all notes, allows selecting one.
- **NotePanel** (center) — hosts the main note area and fills the remaining
  space.
- **InspectorPanel** (right panel) — shows and edits the selected note's properties.

Default visibility of the sidebar, note list, and inspector is set in
`app/config/default.yaml`. The UI can override these values at runtime.

When the application opens on the default route, the frontend loads notes from
`GET /api/notes` and renders them in `NotesListPanel`. Each row shows the note
title derived from its `id`, along with a short content preview and modified
date.

After notes load, the first note becomes the active note automatically and is
highlighted in `NotesListPanel`. Selecting a different row updates the active
note shown in the `NotePanel`, including the note title above the Editor.js
surface.

## Configuration

| Key                         | Type    | Default     | Description                                        |
| --------------------------- | ------- | ----------- | -------------------------------------------------- |
| `applicationType`           | string  | `"desktop"` | Application mode: `browser`, `desktop`, `cloud`    |
| `vault`                     | string  | `"./vault"` | Path to the vault directory for desktop storage    |
| `editor.autosaveDelay`      | number  | `2000`      | Milliseconds of idle time before content autosaves |
| `layout.showInspectorPanel` | boolean | `true`      | Show the InspectorPanel                            |
| `layout.showSidebarPanel`   | boolean | `true`      | Show the SidebarPanel                              |
| `layout.showNotesListPanel` | boolean | `true`      | Show the NotesListPanel                            |

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
- The frontend loads all notes on app open and displays them in
  `NotesListPanel`.

### Browser Storage

When `applicationType` is `browser`, notes are stored in the browser's
localStorage as JSON-serialized Markdown documents with YAML frontmatter.

### Note Editor

The note content area uses Editor.js as the editing surface.

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

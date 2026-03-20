# Product Manual

## Application Layout

- **Sidebar** (left) — navigation and app-level actions.
- **Note list** (left panel) — lists all notes, allows selecting one.
- **Editor** (center) — displays and edits the selected note content.
- **Inspector** (right panel) — shows and edits the selected note's properties.
- **Toolbar** (top) — contextual actions for the current view.

Default visibility of the sidebar, note list, and inspector is set in
`app/config/default.yaml`. The UI can override these values at runtime.

## Configuration

| Key                    | Type    | Default     | Description                                     |
| ---------------------- | ------- | ----------- | ----------------------------------------------- |
| `applicationType`      | string  | `"browser"` | Application mode: `browser`, `desktop`, `cloud` |
| `layout.showInspector` | boolean | `true`      | Show the Inspector panel                        |
| `layout.showSidebar`   | boolean | `true`      | Show the sidebar                                |
| `layout.showNoteList`  | boolean | `true`      | Show the note list panel                        |

## Features

See `docs/features/` for the backlog. Document each feature here as it ships.

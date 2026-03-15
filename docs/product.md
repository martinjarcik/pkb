# Product Manual

Notes is a simple, open-source note-taking application for web and desktop.
It stores portable, user-owned note data and works across web and macOS.

## Application Layout

The application has a single-page layout with the following regions:

- **Sidebar** (left) — navigation and app-level actions.
- **Note list** (left panel) — lists all notes, allows selecting one.
- **Editor** (center) — displays and edits the selected note content.
- **Inspector** (right panel) — shows metadata for the selected note.
- **Toolbar** (top) — contextual actions for the current view.

Visibility of the sidebar and note list is controlled by the `layout`
configuration in `app/config/default.yaml`.

## Configuration

The application is configured via `app/config/default.yaml`. Available options:

| Key                   | Type    | Default | Description                         |
| --------------------- | ------- | ------- | ----------------------------------- |
| `features.metadata`   | boolean | `true`  | Show note metadata in the inspector |
| `layout.showSidebar`  | boolean | `true`  | Show the sidebar                    |
| `layout.showNoteList` | boolean | `true`  | Show the note list panel            |

## Features

No features have been implemented yet. As features are developed, they will
be documented here using the following structure per feature:

---

**Template — do not include in the final document, for reference only:**

### Feature Name

_Configuration flag:_ `features.<flag>` (default: `true`/`false`)

**What it does:**
One paragraph describing the capability from the user's perspective.

**How to use it:**

1. Step-by-step instructions describing the user interaction.
2. Each step describes what the user does and what the application shows.
3. Steps are specific enough to drive a browser-based test.

**Behavior details:**

- Specific observable behaviors, edge cases, and defaults.
- Each item is a testable statement.

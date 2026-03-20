# Feature: Application Layout

## Problem Statement

The application currently renders a placeholder home page instead of the base
workspace structure described in the product documentation. Users need a stable
default layout with dedicated regions for navigation, note browsing, note work,
and properties so the app has a predictable shell for future note features.

## User Flows

### Flow 1: Open the application with the default layout

**Intent:** See the default application structure on first load.
**Steps:**

1. User opens the application.
2. System renders the full-height application shell.
3. User sees `Sidebar`, `NoteList`, `NotePanel`, and `Inspector` arranged from
   left to right.

### Flow 2: Hide optional layout panels from configuration

**Intent:** Open the application with only the configured optional panels shown.
**Steps:**

1. Configuration provides visibility defaults for `Sidebar`, `NoteList`, and
   `Inspector`.
2. System initializes layout state from those config defaults.
3. User sees only the enabled optional panels, while `NotePanel` remains visible
   and expands to fill remaining space.

## User Acceptance Tests

- `tests/e2e/app-layout.spec.ts` — verifies the shipped default config renders
  the four layout regions on first load

## Requirements

- R1: The app must render a full-viewport layout with `Sidebar`, `NoteList`,
  `NotePanel`, and `Inspector` in left-to-right order.
- R2: `Sidebar` visibility must respect `layout.showSidebar`.
- R3: `NoteList` visibility must respect `layout.showNoteList`.
- R4: `Inspector` visibility must respect `layout.showInspector`.
- R5: `NotePanel` must always remain visible and fill the remaining horizontal
  space.
- R6: Hidden optional panels must not reserve layout space.

## Non-Functional Requirements

- NFR1: Layout state must follow the configuration and state-management rules in
  `docs/architecture.md`.
- NFR2: Layout state defaults must be covered by unit tests without requiring
  Vue component rendering in unit tests.
- NFR3: The layout implementation must stay simple and avoid abstractions beyond
  a small pure helper needed for testing.

## Domain Alignment

- Canonical terms used (must match `docs/ubiquitous-language.md`): `Note`,
  `Inspector`
- Affected bounded context: `Workspace Catalog`, `Configuration`
- Invariants:
  - `NotePanel` is always rendered.
  - `Sidebar`, `NoteList`, and `Inspector` are optional regions controlled by
    layout config.
  - Layout defaults come from `app/config/default.yaml`.

## Design

- Pencil file: none; no design file yet for this feature
- Component mapping:
  - application sidebar -> `app/components/Sidebar.vue`
  - note list panel -> `app/components/NoteList.vue`
  - note panel -> `app/components/NotePanel.vue`
  - inspector panel -> `app/components/Inspector.vue`
  - application shell -> `app/layouts/default.vue`

## Slices

### Slice 1: Layout state from config

**User story:** As a user, I want panel visibility to follow configuration
defaults so the app opens with the correct panels shown.

**Acceptance criteria:**

1. Given layout config with all values `true`, when layout state is created,
   then all three optional panels are visible.
2. Given `showSidebar: false`, when layout state is created, then only the
   sidebar is hidden.
3. Given `showNoteList: false`, when layout state is created, then only the
   note list is hidden.
4. Given `showInspector: false`, when layout state is created, then only the
   inspector is hidden.

**Requirements:** R2, R3, R4

**Implementation plan:**

- `app/composables/useLayout.ts` — add `createLayoutState()` and `useLayout()`

**Unit tests:**

- `tests/unit/composables/useLayout.test.ts`
  - `it('returns all optional panels visible when config enables them')`
  - `it('hides sidebar when showSidebar is false')`
  - `it('hides note list when showNoteList is false')`
  - `it('hides inspector when showInspector is false')`

### Slice 2: Default application layout

**User story:** As a user, I want a stable four-panel application layout so I
can navigate notes and work in the note area.

**Acceptance criteria:**

1. Given the default config, when the app loads, then `Sidebar`, `NoteList`,
   `NotePanel`, and `Inspector` are visible.
2. Given any optional panel is hidden by layout state, when the layout renders,
   then that panel is removed from the DOM and does not reserve width.
3. Given optional panels are hidden, when the layout renders, then `NotePanel`
   remains visible and fills the remaining horizontal space.

**Requirements:** R1, R5, R6

**Implementation plan:**

- `app/components/NotePanel.vue` — rename from `Editor.vue`
- `app/layouts/default.vue` — compose `Sidebar`, `NoteList`, page slot, and
  `Inspector`
- `app/app.vue` — wrap `NuxtPage` with `NuxtLayout`
- `app/pages/index.vue` — render `NotePanel`

**Unit tests:**

- None. Component rendering stays covered by e2e plus the pure layout-state
  unit tests.

## Slice Review

- No duplicate requirements across slices: Slice 1 covers config-derived layout
  state; Slice 2 covers layout composition and rendering.
- No overlapping responsibilities: config defaults stay in the composable; page
  structure stays in the layout and page components.
- Parent requirement coverage:
  - Slice 1 covers R2, R3, R4.
  - Slice 2 covers R1, R5, R6.
- The solution stays intentionally small: no runtime settings UI, no
  speculative panel framework, and no extra layout regions.

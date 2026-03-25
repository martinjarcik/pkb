# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Add 2-second debounced autosave for note content, including flush-on-switch
  behavior so pending edits persist before the active note changes.
- Auto-select the first loaded note on app open, highlight it in
  `NotesListPanel`, and let list clicks retarget the editor.
- Add an Editor.js-based note editor that loads the first note's Markdown
  content through a client-side Markdown-to-block translation layer.
- Add the default application layout with `SidebarPanel`, `NotesListPanel`, `NotePanel`,
  and `InspectorPanel`, including config-driven visibility for optional panels.
- Load notes into shared frontend state on app open and render them in
  `NotesListPanel` using each note `id` as the visible row title.
- Add filesystem storage adapter for desktop mode. Notes are persisted as
  Markdown files with YAML frontmatter in a configurable vault directory.
- Change default `applicationType` from `browser` to `desktop`.
- Add `vault` configuration option (default: `./vault`).
- Add browser note storage with YAML frontmatter serialization and config-based
  adapter routing.

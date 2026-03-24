# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

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

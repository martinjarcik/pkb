# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Load only the first 1 KiB of note Content for the notes list catalog, then
  fetch the full note only when it becomes selected in the editor.
- Add an Inbox item to `SidebarNavigation`, select it by default on app open,
  and filter `NotesListPanel` to notes that live directly in the vault root.
- Add a create-note action to `NotesListActions` that inserts a new localized
  note at the top of the list, opens it immediately, and focuses the note
  title for inline renaming.
- Add config-backed i18n infrastructure with an English locale file and
  translated UI/editor strings wired through `@nuxtjs/i18n`.
- Display the active note title in `NoteTemplate`, make it editable inline, and
  save title changes by renaming the note filename with collision-safe suffixes.
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

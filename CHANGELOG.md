# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Convert the app to a client-only SPA: Nuxt SSR is disabled, startup now loads
  full notes into in-memory client state, note search/trash purge/webhooks run on
  the client, config/meta persistence moved behind client-side persistence
  helpers, and Nitro now exposes only minimal filesystem proxy routes plus
  vault asset endpoints behind the new desktop `PlatformApi` boundary.
- Add whole-vault notes search in `NotesListControls`: each keystroke filters the
  already loaded in-memory notes by full title and full content (including
  trashed notes), clears visible sidebar/tag selection while search is active,
  and restores the previous sidebar view when the query is cleared.
- Refactor internal note-id, markdown-conversion, and config-parsing modules
  into smaller units; centralize repeated helpers; remove the unused
  `radix-vue` dependency; and align documentation with the current
  implementation.
- Add an Editor.js `Big Emoji` inline tool backed by `emoji-picker-element`,
  rendering selected emoji at `2em` in the editor while preserving Markdown
  storage as bold emoji such as `**🤖**`.
- Add an Editor.js inline highlight tool with eight color options, default
  yellow highlight on selection, and Markdown round-trip as `==text==` or
  `==<emoji>text==` for colored highlights.
- Add Editor.js image blocks: `@editorjs/image` with multipart upload to
  `POST /api/vault-assets/upload`, serving files from `GET /api/vault-assets/*`,
  Markdown round-trip as `![caption](<vault-relative path>)`, configurable
  `editor.assetsFolder` (default `assets`), and exclusion of that top-level
  folder name from the sidebar folder list.
- Add folder emoji icons for the sidebar: optional icon per top-level folder
  via `FolderDialog` (create or edit), `emoji-picker-element` in a popover,
  hover pencil on folder rows, and persistence in workspace `meta.yaml`
  through the desktop platform API layer (default path overridable with
  `PKB_META_PATH`).
- Add non-distraction mode: `NoteControls` toggle (accent `Maximize2` icon) hides
  SidebarPanel, NotesListPanel, and InspectorPanel for the session; a second
  click restores the previous panel visibility without persisting to app config.
  While active, `NoteTemplate` constrains the editor column to 50% width and
  centers it horizontally.
- Add per-note webhooks: optional `webhook` Application Property (HTTPS URL
  under `app` in frontmatter), webhook icon and dialog in `NoteControls`, and
  client-side POST to that URL after successful save (`event: updated`) or
  trash (`event: deleted`) with a JSON body containing the full note snapshot.
- Add note pinning: `pinned` Application Property under `app` frontmatter, pin
  control in `NoteControls` (accent when pinned, `Pin` / `PinOff` icons), pinned
  notes sorted to the top of each sidebar view’s list with a 5% accent row
  background when not selected.
- Add a `Tasks` sidebar view that shows notes with unfinished checklist items,
  compute `hasTasks` on save from unchecked markdown task list entries, and
  persist Application Properties under the `app` frontmatter namespace.
- Add three-state tag selection cycle (idle / active / pinned) in the sidebar.
  Clicking a tag activates it (replacing any previously active tag). Clicking
  an active tag pins it (survives further clicks). Clicking a pinned tag
  removes it. Pinned tags display in bold. Switching to Inbox or a folder
  clears all tag states.
- Extract inline hashtags into the top-level `tags` frontmatter Property on
  save, add a `SidebarTags` section with multi-tag AND filtering, and add an
  Editor.js inline hashtag formatting tool.
- Add `title` and `description` as Derived Properties on the Note and
  NoteCatalogRow objects. These are computed from the note `id` and Content
  at load/save time, excluded from frontmatter serialization, and consumed
  directly by the notes list and editor title block. The description logic
  previously embedded in `useNotes` now lives in `app/notes/noteDescriptionFromContent.ts`.
- Load full note Content into client state at startup and derive notes-list rows
  from the in-memory notes instead of fetching note bodies on selection.
- Add an Inbox item to `SidebarNavigation`, select it by default on app open,
  and filter `NotesListPanel` to notes that live directly in the vault root.
- Add a create-note action to `NotesListActions` that inserts a new localized
  note at the top of the list, opens it immediately, and focuses the note
  title for inline renaming.
- Add config-backed i18n infrastructure with an English locale file and
  translated UI/editor strings wired through the custom `useTranslations`
  composable.
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

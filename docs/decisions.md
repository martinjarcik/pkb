## D001 — 2026-03

Keep in-memory notes flat while serializing user-defined note properties as YAML frontmatter at the storage boundary.

## D002 — 2026-03

Use a factory function for filesystem storage to accept the vault path at runtime, unlike the browser adapter which is a module-level singleton.

## D003 — 2026-03

Derive note timestamps from file system stats (birthtime for createdAt, mtime for modifiedAt) rather than storing them in frontmatter, keeping timestamps as storage-provided system properties.

## D004 — 2026-03

Duplicate frontmatter serialization logic between browser and filesystem adapters rather than extracting it, per the three-place extraction rule. Extract to app/notes/ if a third adapter needs it.

## D005 — 2026-03

Load Editor.js and the community Markdown converter only in the browser while keeping Markdown as the canonical note Content format.

## D006 — 2026-03

Superseded by D011. Previously: use `Note title` as the canonical term for the user-visible label derived from a note `id`, while treating any user-defined `title` property as ordinary note data.

## D007 — 2026-03

Persist note title edits by renaming the note `id` basename, keeping the current folder and using numeric suffixes when the target filename already exists.

## D008 — 2026-03

Use `@nuxtjs/i18n` locale files for user-facing UI strings while selecting the active locale from `AppConfig`, with English as the default fallback.

## D009 — 2026-03

Serialize Application Properties under a top-level `app` namespace key in YAML frontmatter to visually separate them from user-defined Properties. In memory, Application Properties are flat top-level fields on the Note. The `app` name was chosen over a product-specific key (e.g. `pkb`) to survive a potential rebrand without note migration.

## D010 — 2026-03

Treat the app as the primary note editor while keeping vault files user-accessible on disk. Do not build automatic reconciliation of concurrent external edits; inconsistencies from out-of-band changes are explicitly out of product scope.

## D011 — 2026-03

Promote `title` and `description` to Derived Properties on the in-memory Note object. They are computed from the note `id` and Content at composition time, listed in `NOTE_SYSTEM_PROPERTY_KEYS` to prevent serialization, and shadow any user-defined frontmatter keys with the same names. Supersedes D006.

## D012 — 2026-03

Add explicit folder creation and persistence to the storage layer. Folders are still not first-class domain objects; they remain path prefixes on note IDs. However, `NoteStorage` now exposes `createFolder(name)` and `loadFolders()` so that empty folders (with no notes) survive across page reloads. On desktop the filesystem adapter uses `mkdir` and `readdir`; the browser adapter persists folder names in a dedicated `localStorage` key. The sidebar merges catalog-derived folders with explicitly created folders. Collapse/expand state is session-only (useState, not persisted).

## D013 — 2026-03

Recompute `hasTasks` from unchecked markdown checklist items on save and persist it as an Application Property under the `app` frontmatter namespace so the sidebar can filter to notes with unfinished tasks without reparsing every note body.

## D014 — 2026-03

Soft-delete notes by setting the `trashedAt` Application Property instead of removing storage. The Trashed sidebar view lists only trashed notes; other views exclude them. Restoring clears `trashedAt` on `moveNote` to Inbox or a folder. Expired trashed notes are permanently deleted when serving `GET /api/notes`, using `notes.trashRetentionDays` from config (default 30). The note toolbar is hidden while a trashed note is selected.

## D015 — 2026-03

Store per-folder sidebar customization (emoji icons) in a dedicated workspace `meta.yaml` file with `GET`/`PUT` API handlers, separate from `AppConfig` and from hidden files inside vault folders, so metadata stays app-scoped and portable alongside the project.

## D015 — 2026-03

Deliver per-note webhooks from the Nitro server only: accept HTTPS URLs, POST JSON with `event` (`updated` after `PUT /api/notes`, `deleted` after `POST /api/notes/trash`) and a full note snapshot, use a short request timeout, and swallow errors so persistence never depends on webhook success.

## D016 — 2026-03

Store note images as files under a configurable top-level vault folder (`editor.assetsFolder`, default `assets`), expose Nitro `POST /api/vault-assets/upload` and `GET /api/vault-assets/*`, persist Markdown as `![caption](<relative path>)`, and hide the configured folder name from sidebar folder lists so asset storage does not appear as a navigable folder view.

## D001 — 2026-03

Keep in-memory notes flat while serializing user-defined note properties as YAML frontmatter at the storage boundary.

## D002 — 2026-03

Use a factory function for filesystem storage to accept the vault path at runtime, unlike the browser adapter which is a module-level singleton.

## D003 — 2026-03

Derive note timestamps from file system stats (birthtime for createdAt, mtime for modifiedAt) rather than storing them in frontmatter, keeping timestamps as storage-provided system properties.

## D004 — 2026-03

Keep shared frontmatter serialization in `app/storage/document.ts`, while browser and filesystem adapters keep only backend-specific read/write behavior.

## D005 — 2026-03

Load Editor.js and the community Markdown converter only in the browser while keeping Markdown as the canonical note Content format.

## D006 — 2026-03

Superseded by D011. Previously: use `Note title` as the canonical term for the user-visible label derived from a note `id`, while treating any user-defined `title` property as ordinary note data.

## D007 — 2026-03

Persist note title edits by renaming the note `id` basename, keeping the current folder and using numeric suffixes when the target filename already exists.

## D008 — 2026-03

Use a custom `useTranslations` composable backed by bundled JSON locale files for user-facing UI strings, selecting the active locale from `AppConfig` with English as the default fallback.

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

Deliver per-note webhooks from the Nitro server only: accept HTTPS URLs, POST JSON with `event` (`updated` after `PUT /api/notes`, `deleted` after `POST /api/notes/trash`) and a full note snapshot, use a short request timeout, and swallow errors so persistence never depends on webhook success.

## D016 — 2026-03

Store note images as files under a configurable top-level vault folder (`editor.assetsFolder`, default `assets`), expose Nitro `POST /api/vault-assets/upload` and `GET /api/vault-assets/*`, persist Markdown as `![caption](<relative path>)`, and hide the configured folder name from sidebar folder lists so asset storage does not appear as a navigable folder view.

## D017 — 2026-03

Replace `vue3-emoji-picker` with `emoji-picker-element` (web component, ~12.5 KB min+gz, zero dependencies, IndexedDB-backed) to fix browser freezes caused by synchronous rendering of ~1,800 emoji DOM nodes on mount. The web component approach also eliminates the need to spin up a separate Vue app instance inside the Editor.js inline tool.

## D018 — 2026-03

Store per-folder sidebar customization (emoji icons) in a dedicated workspace `meta.yaml` file with `GET`/`PUT` API handlers, separate from `AppConfig` and from hidden files inside vault folders, so metadata stays app-scoped and portable alongside the project.

## D019 — 2026-04

Run the app as a client-only SPA: load full notes into memory at startup, keep search/trash purge/webhook dispatch/config-meta orchestration on the client, and keep Nitro only as a minimal filesystem/YAML proxy plus vault asset endpoints. Folder rows are derived from loaded note ids, with `meta.yaml` entries preserving explicitly created empty folders across reloads. Supersedes the server-driven parts of D012, D014, and D015.

## D020 — 2026-04

Add a `PlatformApi` boundary for desktop-only raw I/O. The current implementation uses HTTP fetch against the minimal Nitro filesystem and asset routes, while future Tauri work will replace that implementation with IPC without changing `NoteStorage`, composables, or editor integration. Config and workspace metadata YAML parsing now happens on the client; Nitro only resolves the scoped config/meta file paths and reads or writes raw text.

## D021 — 2026-04

Keep the browser-served app and future Tauri desktop app on the same SPA architecture. The browser-served desktop mode continues to use the HTTP-backed `PlatformApi`, while Tauri will swap in an IPC-backed `PlatformApi` without bundling Nitro into the desktop app. Runtime detection should identify Tauri directly instead of relying on persisted browser state, and the desktop frontend should be served from static `nuxt generate` output rather than a Nuxt server.

## D022 — 2026-04

Replace `applicationType` (`desktop` | `browser`) with `storageType` (`filesystem` | `database`) to model storage as a configurable backend instead of a deployment-mode toggle. Remove the browser localStorage adapter entirely. The Vault concept is relevant only for filesystem storage. The `database` storage type is reserved for a future remote database adapter. Supersedes the browser-specific parts of D002, D004, D012, D019, and D021.

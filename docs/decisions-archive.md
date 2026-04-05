## Archived Superseded Decisions

Superseded decisions were moved here to keep `docs/decisions.md` focused on active architecture.

## D002 — 2026-03

Partially superseded by D022 (browser adapter removed).

Use a factory function for filesystem storage to accept the vault path at runtime, unlike the browser adapter which is a module-level singleton.

## D004 — 2026-03

Partially superseded by D022 (browser adapter removed).

Keep shared frontmatter serialization in `app/storage/document.ts`, while browser and filesystem adapters keep only backend-specific read/write behavior.

## D005 — 2026-03

Partially superseded by D023 (Nuxt/Nitro removed; Editor.js loads in the desktop app without Nuxt runtime constraints).

Load Editor.js and the community Markdown converter only in the browser while keeping Markdown as the canonical note Content format.

## D006 — 2026-03

Superseded by D011. Previously: use `Note title` as the canonical term for the user-visible label derived from a note `id`, while treating any user-defined `title` property as ordinary note data.

## D012 — 2026-03

Partially superseded by D019 and D022 (browser adapter and server folder API removed).

Add explicit folder creation and persistence to the storage layer. Folders are still not first-class domain objects; they remain path prefixes on note IDs. However, `NoteStorage` now exposes `createFolder(name)` and `loadFolders()` so that empty folders (with no notes) survive across page reloads. On desktop the filesystem adapter uses `mkdir` and `readdir`; the browser adapter persists folder names in a dedicated `localStorage` key. The sidebar merges catalog-derived folders with explicitly created folders. Collapse/expand state is session-only (useState, not persisted).

## D014 — 2026-03

Partially superseded by D019 (trash purge moved to the client).

Soft-delete notes by setting the `trashedAt` Application Property instead of removing storage. The Trashed sidebar view lists only trashed notes; other views exclude them. Restoring clears `trashedAt` on `moveNote` to Inbox or a folder. Expired trashed notes are permanently deleted when serving `GET /api/notes`, using `notes.trashRetentionDays` from config (default 30). The note toolbar is hidden while a trashed note is selected.

## D015 — 2026-03

Superseded by D019. Webhooks are now dispatched client-side.

Deliver per-note webhooks from the Nitro server only: accept HTTPS URLs, POST JSON with `event` (`updated` after `PUT /api/notes`, `deleted` after `POST /api/notes/trash`) and a full note snapshot, use a short request timeout, and swallow errors so persistence never depends on webhook success.

## D020 — 2026-04

Superseded by D023. The HTTP-backed `PlatformApi` was replaced by Tauri IPC.

Add a `PlatformApi` boundary for desktop-only raw I/O. The current implementation uses HTTP fetch against the minimal Nitro filesystem and asset routes, while future Tauri work will replace that implementation with IPC without changing `NoteStorage`, composables, or editor integration. Config and workspace metadata YAML parsing now happens on the client; Nitro only resolves the scoped config/meta file paths and reads or writes raw text.

## D021 — 2026-04

Superseded by D023. The browser-served mode was dropped.

Keep the browser-served app and future Tauri desktop app on the same SPA architecture. The browser-served desktop mode continues to use the HTTP-backed `PlatformApi`, while Tauri will swap in an IPC-backed `PlatformApi` without bundling Nitro into the desktop app. Runtime detection should identify Tauri directly instead of relying on persisted browser state, and the desktop frontend should be served from static `nuxt generate` output rather than a Nuxt server.

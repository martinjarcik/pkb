Archived superseded decisions live in `docs/decisions-archive.md`.

## D001 — 2026-03

Keep in-memory notes flat while serializing user-defined note properties as YAML frontmatter at the storage boundary.

## D003 — 2026-03

Derive note timestamps from file system stats (birthtime for createdAt, mtime for modifiedAt) rather than storing them in frontmatter, keeping timestamps as storage-provided system properties.

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

## D013 — 2026-03

Recompute `hasTasks` from unchecked markdown checklist items on save and persist it as an Application Property under the `app` frontmatter namespace so the sidebar can filter to notes with unfinished tasks without reparsing every note body.

## D016 — 2026-03

Partially superseded by D023. Asset upload and serving now use `PlatformApi` instead of Nitro routes.

Store note images as files under a configurable vault-relative folder path (`editor.assetsFolder`, default `assets`), expose Nitro `POST /api/vault-assets/upload` and `GET /api/vault-assets/*`, persist Markdown as `![caption](<relative path>)`, and hide the configured top-level folder segment from sidebar folder lists so asset storage does not appear as a navigable folder view.

## D017 — 2026-03

Replace `vue3-emoji-picker` with `emoji-picker-element` (web component, ~12.5 KB min+gz, zero dependencies, IndexedDB-backed) to fix browser freezes caused by synchronous rendering of ~1,800 emoji DOM nodes on mount. The web component approach also eliminates the need to spin up a separate Vue app instance inside the Editor.js inline tool.

## D018 — 2026-03

Partially superseded by D023. `meta.yaml` is now read and written via `PlatformApi`, not HTTP handlers.

Store per-folder sidebar customization (emoji icons) in a dedicated workspace `meta.yaml` file with `GET`/`PUT` API handlers, separate from `AppConfig` and from hidden files inside vault folders, so metadata stays app-scoped and portable alongside the project.

## D019 — 2026-04

Run the app as a client-only SPA: load full notes into memory at startup, keep search/trash purge/webhook dispatch/config-meta orchestration on the client, and keep Nitro only as a minimal filesystem/YAML proxy plus vault asset endpoints. Folder rows are derived from loaded note ids, with `meta.yaml` entries preserving explicitly created empty folders across reloads. Supersedes the server-driven parts of D012, D014, and D015.

## D022 — 2026-04

Replace `applicationType` (`desktop` | `browser`) with `storageType` to model storage as a configurable backend instead of a deployment-mode toggle. Remove the browser localStorage adapter entirely. The Vault concept is relevant only for filesystem storage. D025 later narrowed the runtime union back to `filesystem` until a concrete second adapter exists. Supersedes the browser-specific parts of D002, D004, D012, D019, and D021.

## D023 — 2026-04

Drop the Nitro proxy and Nuxt runtime for desktop delivery: the app now targets Tauri with a plain Vue + Vite frontend, keeps `PlatformApi` as the raw I/O boundary, stores scoped desktop files alongside the vault, and uses Tauri IPC for note, config, metadata, folder, and asset operations.

## D024 — 2026-04

Expose persisted `AppConfig` editing through a centralized Settings dialog opened from `NotesListActions`, and keep runtime UI state bound to disk-backed config refs instead of bundled defaults.

## D025 — 2026-04

Remove `database` from the runtime `StorageType` union until a concrete adapter exists. The storage router, platform router, and `NoteStorage` adapter boundary remain designed for multiple backends; re-adding a new storage type requires only extending the union and adding a case in each router. Partially revises D022.

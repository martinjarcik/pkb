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

Store note images as files under a configurable vault-relative folder path
(`editor.assetsFolder`, default `assets`), resolve desktop-safe asset URLs
through `PlatformApi`, persist Markdown as `![caption](<relative path>)`, and
hide the configured top-level folder segment from sidebar folder lists so asset
storage does not appear as a navigable folder view.

## D017 — 2026-03

Replace `vue3-emoji-picker` with `emoji-picker-element` (web component, ~12.5 KB min+gz, zero dependencies, IndexedDB-backed) to fix browser freezes caused by synchronous rendering of ~1,800 emoji DOM nodes on mount. The web component approach also eliminates the need to spin up a separate Vue app instance inside the Editor.js inline tool.

## D018 — 2026-03

Store per-folder sidebar customization (emoji icons) in a dedicated workspace
`meta.yaml` file, read and written through `PlatformApi`, separate from
`AppConfig` and from hidden files inside vault folders, so metadata stays
app-scoped and portable alongside the project.

## D019 — 2026-04

Run the app as a client-only SPA: load full notes into memory at startup, keep
search/trash purge/webhook dispatch/config-meta orchestration on the client,
and let `PlatformApi` handle raw filesystem, scoped-file, and asset I/O.
Folder rows are derived from loaded note ids, with `meta.yaml` entries
preserving explicitly created empty folders across reloads. Supersedes the
server-driven parts of D012, D014, and D015.

## D022 — 2026-04

Replace `applicationType` (`desktop` | `browser`) with `storageType` to model storage as a configurable backend instead of a deployment-mode toggle. Remove the browser localStorage adapter entirely. The Vault concept is relevant only for filesystem storage. D025 later narrowed the runtime union back to `filesystem` until a concrete second adapter exists. Supersedes the browser-specific parts of D002, D004, D012, D019, and D021.

## D023 — 2026-04

Drop the Nitro proxy and Nuxt runtime for desktop delivery: the app now targets Tauri with a plain Vue + Vite frontend, keeps `PlatformApi` as the raw I/O boundary, stores scoped desktop files alongside the vault, and uses Tauri IPC for note, config, metadata, folder, and asset operations.

## D024 — 2026-04

Expose persisted `AppConfig` editing through a centralized Settings dialog opened from `NotesListActions`, and keep runtime UI state bound to disk-backed config refs instead of bundled defaults.

## D025 — 2026-04

Remove `database` from the runtime `StorageType` union until a concrete adapter exists. The storage router, platform router, and `NoteStorage` adapter boundary remain designed for multiple backends; re-adding a new storage type requires only extending the union and adding a case in each router. Partially revises D022.

## D026 — 2026-04

Derive sidebar folders from actual vault directories on disk (via `NoteStorage.loadFolderNames()` backed by a `list_directories` Tauri IPC command) instead of extracting folder names from loaded note ids or workspace metadata. Folder metadata (`meta.yaml`) provides enrichment (emoji icons) but is not a source of folder names. The configured assets folder name is still excluded from the sidebar list. Partially revises D019.

## D027 — 2026-04

Support nested subfolders in the sidebar. `list_directories` now recursively walks the vault and returns vault-relative paths for all directories (e.g. `Work`, `Work/Archive`, `Work/Archive/2024`). The sidebar view type uses `folderPath` (a vault-relative path string) instead of `folderName` (single segment). The sidebar renders folders as an expandable tree with per-node expand/collapse state. Folder views filter to direct children of the selected folder path. Subfolder creation, drag-and-drop move targets, and folder metadata all use full vault-relative paths. Extends D026.

## D028 — 2026-04

Stop persisting `hasTasks` as an Application Property. The `Tasks` sidebar view now derives its note set directly from loaded note content by scanning for unchecked markdown checklist items, which removes stale frontmatter and makes externally authored notes show up without an app save. Partially supersedes D013.

## D029 — 2026-04

Introduce `app/import/` as a problem-domain folder for note import guides. Each guide is a single `.ts` file that owns its user-facing label/title/description plus a `run` function built from generic Tauri file-copy commands. The first guide is Apple Notes.

## D030 — 2026-04

Support Notion imports with a generic `read_text_files` Tauri command so the guide can preserve note folders, convert CSV exports to Markdown tables, and flatten asset-only directories into the configured assets folder.

## D031 — 2026-04

Persist first-run onboarding progress and completion as an app-scoped YAML file outside the Vault so the blocking setup guide can resume across launches without depending on note storage contents.

## D032 — 2026-04

Persist workspace folder metadata in `meta.yaml` inside the currently configured Vault root instead of the app data directory. This keeps folder icons aligned with the active storage target while `app-config.yaml` and onboarding state remain app-scoped. Partially supersedes D018.

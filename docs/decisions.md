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

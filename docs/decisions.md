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

Use `Note title` as the canonical term for the user-visible label derived from a note `id`, while treating any user-defined `title` property as ordinary note data unless a future feature wires it into the UI.

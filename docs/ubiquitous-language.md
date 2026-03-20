# Ubiquitous Language

Canonical vocabulary for the project.
When other docs use different wording, this file wins.

## Term Rules

- One canonical term per concept.
- Prefer domain terms over storage terms.
- Prefer short, stable wording that LLMs can reuse consistently.
- If a feature introduces a new domain term, update this file first.

## Canonical Terms

| Term                | Meaning                                                         | Allowed aliases               | Avoid                                             |
| ------------------- | --------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `Note`              | The primary logical document.                                   | document                      | file, page                                        |
| `Content`           | The rich content section of a note.                             | —                             | body, markdown body                               |
| `Properties`        | Editable structured note-owned data, serialized as frontmatter. | property values               | storage fields                                    |
| `System Properties` | Read-only storage-provided values (e.g. `createdAt`).           | system fields, derived fields | note properties                                   |
| `Inspector`         | UI region for viewing and editing note properties.              | properties editor             | properties sidebar                                |
| `Template`          | Rendered wrapper around content; not edited inline.             | template wrapper              | page wrapper                                      |
| `Storage`           | Persistence implementation for logical notes.                   | storage adapter, adapter      | database (when the storage may not be a database) |
| `Vault`             | The configured top-level directory for filesystem storage.      | notes location, storage root  | workspace root                                    |

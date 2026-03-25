# Ubiquitous Language

Canonical vocabulary for the project.
When other docs use different wording, this file wins.

## Term Rules

- One canonical term per concept.
- Prefer domain terms over storage terms.
- Prefer short, stable wording that LLMs can reuse consistently.
- If a feature introduces a new domain term, update this file first.

## Canonical Terms

| Term                     | Meaning                                                                                                                                                                                                                                                                    | Allowed aliases                  | Avoid                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `Note`                   | The primary logical document.                                                                                                                                                                                                                                              | document                         | file, page                                        |
| `Note title`             | Human-readable title shown in the UI. It is edited in the template area and persisted by renaming the note `id` basename (with `.md`). A user-defined `title` property remains ordinary note data unless a feature says otherwise.                                         | note name, display name          | file name                                         |
| `Content`                | The rich content section of a note.                                                                                                                                                                                                                                        | —                                | body, markdown body                               |
| `Properties`             | User-defined note data stored as top-level fields on a Note. Values may be scalars, arrays, or nested objects. Serialized as top-level YAML frontmatter keys. Editable in the InspectorPanel.                                                                              | user properties, property values | storage fields, metadata                          |
| `Application Properties` | Application-managed per-note state (e.g. `favorite`). Controlled through dedicated UI, not user-editable in the property editor. In memory these are flat top-level Note fields. On disk they are serialized under the `app` namespace key in YAML frontmatter (see D009). | app properties                   | reserved properties, system properties            |
| `System Properties`      | Read-only storage-provided values (e.g. `createdAt`).                                                                                                                                                                                                                      | system fields, derived fields    | note properties                                   |
| `InspectorPanel`         | UI region for viewing and editing note properties.                                                                                                                                                                                                                         | properties editor                | properties sidebar                                |
| `Template`               | Rendered wrapper around content; not edited inline.                                                                                                                                                                                                                        | template wrapper                 | page wrapper                                      |
| `Storage`                | Persistence implementation for logical notes.                                                                                                                                                                                                                              | storage adapter, adapter         | database (when the storage may not be a database) |
| `Vault`                  | The configured top-level directory for filesystem storage.                                                                                                                                                                                                                 | notes location, storage root     | workspace root                                    |

# Feature: Filesystem Storage

## Problem Statement

Desktop users need their notes stored as files on the local filesystem so they
can back up, version-control, and access notes with other tools. The app must
read and write Markdown files with YAML frontmatter inside a user-configured
Vault directory.

## User Flows

### Flow 1: Save a note to the vault

**Intent:** Persist a new or updated note as a Markdown file.
**Steps:**

1. User creates or edits a note with properties and content.
2. System serializes properties as YAML frontmatter and content as Markdown body.
3. System writes the file to the vault at the path matching the note ID.
4. System returns the saved note with storage-provided timestamps.

### Flow 2: Load notes from the vault

**Intent:** Retrieve all existing notes from the vault on startup.
**Steps:**

1. System recursively scans the vault for `.md` files.
2. System parses each file into properties (frontmatter) and content (body).
3. System reads file stats for `createdAt` and `modifiedAt` timestamps.
4. User receives a list of notes ordered by most recently modified first.

### Flow 3: Delete a note from the vault

**Intent:** Remove a note permanently.
**Steps:**

1. User requests deletion of a note by ID.
2. System deletes the corresponding file from the vault.
3. The note no longer appears when notes are loaded.

## User Acceptance Tests

No e2e tests for this feature. Storage is pure domain logic tested entirely
through unit tests.

## Requirements

- R1: Notes are stored as `.md` files with YAML frontmatter in the configured
  vault directory.
- R2: Note `id` equals the relative file path within the vault
  (e.g. `notes/welcome.md`).
- R3: `createdAt` is derived from the file's `birthtime`; `modifiedAt` from
  the file's `mtime`.
- R4: The vault path is configurable in `app/config/default.yaml`, with a
  default value of `./vault`.
- R5: `applicationType` in `default.yaml` defaults to `desktop`.
- R6: Missing parent directories are created automatically when saving a note.
- R7: Note IDs that resolve outside the vault are rejected with an error
  (path traversal protection).
- R8: `loadNotes()` returns notes ordered by most recently modified first
  (`mtime` descending).
- R9: The default vault directory (`./vault`) is created as part of project
  setup.

## Non-Functional Requirements

- NFR1: The filesystem adapter only runs in a Node.js environment. It must not
  be imported in browser bundles.

## Domain Alignment

- Canonical terms used (must match `docs/ubiquitous-language.md`):
  Note, Content, Properties, System Properties, Storage, Vault
- Affected bounded context: Note Storage, Configuration
- Invariants: note ID always resolves within the vault; timestamps are
  storage-provided, never user-editable.

## Design

No UI changes. This feature is a backend storage adapter.

## Slices

### Slice 1: Save and load notes via the filesystem

**User story:** As a desktop user, I want my notes saved as Markdown files in
a vault directory, so that I can access them with other tools and back them up.

**Acceptance criteria:**

1. Given a vault directory, when a note is saved with properties and content,
   then a `.md` file is written at the note's ID path with YAML frontmatter
   and Markdown body.
2. Given a vault with `.md` files, when notes are loaded, then each file is
   parsed into a note with correct properties, content, and file-stat
   timestamps.
3. Given a vault with multiple notes, when notes are loaded, then they are
   returned ordered by most recently modified first.
4. Given a note with empty properties, when saved, then the file contains only
   the Markdown content without a frontmatter wrapper.
5. Given a note ID with path separators (e.g. `sub/note.md`), when saved, then
   missing parent directories are created automatically.
6. Given a vault with a file containing broken YAML frontmatter, when notes are
   loaded, then the file is still returned with empty properties and the
   content preserved.

**Requirements:** R1, R2, R3, R6, R8

**Implementation plan:**

- `app/storage/filesystem.ts` — new file; `createFilesystemStorage` factory
  returning a `NoteStorage` adapter backed by `fs/promises`.
- `app/storage/router.ts` — wire `desktop` case to the filesystem adapter.

**Unit tests:**

- `tests/unit/storage/filesystem.test.ts`
  - `it('saves a note as a markdown file with yaml frontmatter')`
  - `it('loads notes with correct properties and timestamps')`
  - `it('returns loaded notes ordered by most recently modified first')`
  - `it('preserves frontmatter properties across save and load')`
  - `it('creates intermediate directories when saving a nested note')`
  - `it('stores raw content without frontmatter when properties are empty')`
  - `it('returns an empty array when the vault is empty')`
  - `it('isolates content from broken frontmatter')`

### Slice 2: Delete a note from the filesystem

**User story:** As a desktop user, I want to delete a note so that it is
permanently removed from my vault.

**Acceptance criteria:**

1. Given a note saved in the vault, when it is deleted by ID, then the file is
   removed from the filesystem.
2. Given a non-existent note ID, when deletion is requested, then no error is
   thrown.

**Requirements:** R1, R2

**Implementation plan:**

- `app/storage/filesystem.ts` — implement `deleteNote`.

**Unit tests:**

- `tests/unit/storage/filesystem.test.ts`
  - `it('deletes a note file by id')`
  - `it('does not throw when deleting a non-existent note')`

### Slice 3: Path traversal protection

**User story:** As a desktop user, I want the app to prevent notes from being
saved or deleted outside my vault, so that my filesystem is protected.

**Acceptance criteria:**

1. Given a note ID containing `..` segments (e.g. `../outside.md`), when saved
   or deleted, then the operation is rejected with an error.
2. Given an absolute path as a note ID, when saved or deleted, then the
   operation is rejected with an error.

**Requirements:** R7

**Implementation plan:**

- `app/storage/filesystem.ts` — add path validation to `saveNote` and
  `deleteNote`.

**Unit tests:**

- `tests/unit/storage/filesystem.test.ts`
  - `it('rejects note IDs that traverse outside the vault')`
  - `it('rejects absolute paths as note IDs')`

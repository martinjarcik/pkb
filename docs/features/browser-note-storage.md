# Feature: Browser Note Storage

## Problem Statement

Browser mode currently stores notes as raw JSON objects in `localStorage`, which
does not match the application's canonical note format. The first storage
feature must make browser-backed notes use the same logical model as other
storage backends: user-defined properties serialized as YAML frontmatter,
Markdown body stored as Content, and storage-owned timestamps managed outside
frontmatter.

## User Flows

### Flow 1: Save note through storage abstraction

**Intent:** Persist a note in browser mode without the caller needing to know
which storage backend is active.
**Steps:**

1. Caller provides note `id`, flat note properties, and `content` to the storage
   abstraction.
2. The browser storage adapter converts properties into YAML frontmatter and
   merges it with the Markdown content into a single document string.
3. The adapter stores that document together with `createdAt` and `modifiedAt`
   metadata in browser `localStorage`.

### Flow 2: Load note through storage abstraction

**Intent:** Read a stored note back as one logical `Note`.
**Steps:**

1. Caller loads notes through the storage abstraction.
2. The browser storage adapter reads the stored document and metadata from
   `localStorage`.
3. The adapter parses frontmatter into flat top-level note properties, returns
   `content` without frontmatter, and includes `createdAt` and `modifiedAt` in
   the resulting `Note`.

### Flow 3: Resolve storage from configuration

**Intent:** Use the configured storage backend without caller-side conditionals.
**Steps:**

1. Caller asks the storage router for the active `NoteStorage`.
2. The router reads `applicationType` from config.
3. The router returns the browser storage adapter when `applicationType` is
   `browser`.

## User Acceptance Tests

None for this feature. Browser note storage changes persistence behavior only
and introduces no user-visible UI change. Verification is covered by unit tests.

## Requirements

- R1: `NoteStorage` must accept note properties and `content` as separate save
  inputs and hide storage-specific serialization details from callers.
- R2: Browser note storage must serialize flat user-defined note properties as
  YAML frontmatter and append Markdown `content` as the document body.
- R3: Browser note storage must return loaded notes as flat objects containing
  top-level user-defined properties, `id`, `content`, `createdAt`, and
  `modifiedAt`.
- R4: `createdAt` and `modifiedAt` must be managed by storage and must not be
  serialized as user frontmatter fields.
- R5: The active storage adapter must be selected from `applicationType` in
  config, with `browser` resolving to the browser storage adapter.
- R6: Browser note storage must support deleting a note by `id`.
- R7: Existing provisional JSON-array note data in browser storage does not need
  to be migrated in this feature.

## Non-Functional Requirements

- NFR1: Storage code must remain in `app/storage/` and use pure TypeScript.
- NFR2: Storage reads must validate parsed frontmatter and stored browser data at
  the boundary.
- NFR3: The implementation must be covered by unit tests and must not add e2e
  tests.
- NFR4: The storage router must stay simple and only branch among known
  application types from config.

## Domain Alignment

- Canonical terms used (must match `docs/ubiquitous-language.md`): `Note`,
  `Properties`, `Content`, `System Properties`, `Storage`
- Affected bounded context: `Note Storage`
- Invariants:
  - `id`, `content`, `createdAt`, and `modifiedAt` are reserved note fields.
  - User-defined note properties are top-level fields in memory; values may be
    structured.
  - User-defined note properties are stored in YAML frontmatter.
  - `createdAt` and `modifiedAt` remain storage-owned System Properties.

## Design

- Pencil file: none; no UI change
- Component mapping:
  - none; no component changes in this feature

## Slices

### Slice 1: Browser note serialization

**User story:** As a browser-mode user, I want saved notes to use the canonical
Markdown-plus-frontmatter format, so that browser storage matches the logical
note model.

**Acceptance criteria:**

1. Given flat note properties and Markdown content, when the note is saved in
   browser mode, then the stored document contains YAML frontmatter plus content
   body.
2. Given a stored browser note document, when notes are loaded, then the result
   contains flat top-level user properties plus `content`, `createdAt`, and
   `modifiedAt`.
3. Given reserved system keys in the save properties input, when the note is
   serialized, then those keys are excluded from frontmatter.

**Requirements:** R1, R2, R3, R4, R6, R7

**Implementation plan:**

- `app/notes/types.ts` — define flat note property types and reserved system
  fields
- `app/storage/types.ts` — update the storage contract to accept separate
  properties and content on save
- `app/storage/browser.ts` — implement browser document serialization, parsing,
  timestamp handling, and delete behavior

**Unit tests:**

- `tests/unit/storage/browser.test.ts`
  - `it('saves browser notes as markdown documents with yaml frontmatter')`
  - `it('loads browser notes as flat notes with storage timestamps')`
  - `it('preserves createdAt and refreshes modifiedAt on update')`
  - `it('deletes notes by id')`

### Slice 2: Config-based storage routing

**User story:** As a maintainer, I want storage backend selection to come from
configuration, so that browser mode can use the browser adapter without
caller-specific branching.

**Acceptance criteria:**

1. Given `applicationType: browser`, when the storage router resolves the active
   adapter, then it returns the browser storage implementation.
2. Given an unsupported storage mode, when the router resolves the adapter, then
   it fails explicitly instead of silently choosing the wrong backend.

**Requirements:** R5

**Implementation plan:**

- `app/storage/router.ts` — select the active storage adapter from config
- `tests/unit/storage/router.test.ts` — verify adapter selection and unsupported
  mode failures

**Unit tests:**

- `tests/unit/storage/router.test.ts`
  - `it('returns browser storage for browser application type')`
  - `it('throws for unimplemented storage backends')`

## Slice Review

- No duplicate requirements across slices: Slice 1 covers browser persistence
  behavior; Slice 2 covers adapter selection only.
- No overlapping responsibilities: serialization/parsing stays in the browser
  adapter; backend selection stays in the router.
- Parent requirement coverage:
  - Slice 1 covers R1, R2, R3, R4, R6, R7.
  - Slice 2 covers R5.
- The solution stays intentionally small: no migration path, no UI changes, no
  e2e tests, no speculative adapter framework.

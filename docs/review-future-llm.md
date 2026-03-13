# Review: Future LLM Onboarding

This document identifies where an LLM receiving **only this repository tree** (no extra explanation) would likely get confused. Fix these to make the repo self-explanatory.

---

## 1. **Stack not installed vs. stack assumed**

- **AI_RULES.md** says: *"The Nuxt/Vue/Tailwind stack is not yet installed."*
- There is **no `package.json`**, **no `nuxt.config`**, and **no lockfile**.
- The codebase still uses **Nuxt/Vite idioms**: `~/` alias, `?raw` import in `app/config/loader.ts`, and expects `yaml` to be installed.

**Confusion:** An LLM may assume the stack exists (because of the app code and docs) and try to run `npm run dev` or add features without initializing the stack first. Or it may assume the repo is framework-agnostic and suggest a different stack.

**Mitigation:** Add a short "Repository state" section at the top of README or AI_RULES: *"No package.json or Nuxt config yet. Domain/storage/config in `app/` are illustrative; run stack init before adding UI or running the app."* Optionally add a `docs/setup.md` that lists the exact init steps (Nuxt 3, Tailwind, shadcn-vue, Tauri, `yaml`).

---

## 2. **Referenced folders that do not exist**

Docs and rules refer to folders that are **not in the tree**:

| Referenced | Exists? |
|------------|--------|
| `app/components/` | No |
| `app/composables/` | No |
| `app/pages/` | No |
| `app/layouts/` | No |
| `app/assets/css/` | No |
| `tests/unit/` | No |
| `tests/acceptance/` | No |

**Confusion:** An LLM might create files in the wrong place, or infer that the project is incomplete in an undefined way. It won’t know whether to create these folders or wait.

**Mitigation:** In **AI_RULES.md** or **docs/architecture.md**, state explicitly: *"These folders are approved but do not exist yet. Create them when first needed (e.g. when implementing the first component or test)."* That makes “create when first needed” the default.

---

## 3. **Design and architecture reference non-existent components**

- **design/pencil.md** maps: Sidebar → `Sidebar.vue`, Note list → `NoteList.vue`, Editor → `Editor.vue`.
- **docs/architecture.md** lists: Sidebar, NoteList, Editor, Inspector, Toolbar, Modals.

**Confusion:** An LLM may look for these components, not find them, and either report “missing files” or create stubs without knowing they are intentional placeholders. The link between “intended layout” and “not implemented yet” is only implied by the empty `app/` structure.

**Mitigation:** In **docs/architecture.md**, add one line: *"These are intended UI regions; corresponding components do not exist yet."* In **design/pencil.md**, add: *"Components are to be created; this file is the design mapping."*

---

## 4. **Two sources of rules**

- **AI_RULES.md** and **.cursor/rules/project.mdc** both describe folder boundaries, conventions, and constraints.
- **docs/architecture.md** says: *"For rules and conventions, see AI_RULES.md (the single source of truth)."*

**Confusion:** An LLM might treat `.cursor/rules/project.mdc` as an additional or overriding source, or try to keep both in sync. Cursor may auto-apply the rule file, so the LLM sees both.

**Mitigation:** In **project.mdc**, add at the top: *"Summary only. Full rules: AI_RULES.md."* Keep project.mdc as a short checklist and avoid duplicating long sections.

---

## 5. **Import alias `~/` undefined in repo**

- **app/storage/types.ts** and **app/storage/browser.ts** use `from "~/notes/types"`.
- **AI_RULES.md** and **docs/architecture.md** say the `~/` alias is from app root.
- There is **no nuxt.config** (or tsconfig) in the repo that defines this alias.

**Confusion:** In a bare clone, TypeScript/Node won’t resolve `~/`. An LLM might think the project is broken, or add a tsconfig/nuxt config and define `~` as project root instead of `app` root, causing wrong paths.

**Mitigation:** In **AI_RULES.md** (or **docs/architecture.md**), clarify: *"The `~/` alias points to the `app/` directory and is configured when the Nuxt project is initialized (e.g. in nuxt.config or tsconfig)."* That sets the expectation that alias setup is part of stack init.

---

## 6. **Config loader uses Vite/Nuxt-specific import**

- **app/config/loader.ts** uses `import rawDefaultConfig from "./default.yaml?raw"`.
- The `?raw` suffix is a Vite (and thus Nuxt) feature; it’s not standard TypeScript/Node.

**Confusion:** An LLM might run or type-check the app with plain Node/ts-node and get “unknown import” or “module not found”. It might replace it with `fs.readFileSync` or another approach and break the intended use in Nuxt.

**Mitigation:** Add a one-line comment in **loader.ts**: `// ?raw is a Vite/Nuxt import; use after stack init.` Optionally in **docs/architecture.md** or **AI_RULES.md**, mention that config loading assumes a Vite/Nuxt environment for asset imports.

---

## 7. **Decisions format is under-specified**

- **AI_RULES.md** says: *"Record all architectural decisions in docs/decisions.md using the format: D00X — YYYY-MM"*.
- **docs/decisions.md** uses `## D00X — YYYY-MM` and a one-line description; no body text or rationale.

**Confusion:** An LLM might add long rationales, multiple lines, or a different format (e.g. `D007 - 2026-03` with a dash), leading to inconsistent history.

**Mitigation:** In **AI_RULES.md**, add a one-line example: *"Example: `## D008 — 2026-03` then one line only, e.g. *Use localStorage for browser; no backend yet.*"* Optionally add that line to **docs/decisions.md** as a comment or example block (if you want examples in-repo).

---

## 8. **Test layout and naming not visible**

- **AI_RULES.md** and **docs/ai-development.md** refer to `tests/unit/` and `tests/acceptance/` but there are no test files.
- Naming is only described as `*.test.ts` (e.g. `notes.test.ts`); it’s unclear whether that’s under `tests/unit/notes.test.ts` or `app/notes/notes.test.ts`.

**Confusion:** An LLM might place unit tests next to source (e.g. `app/notes/notes.test.ts`) or create a different structure, and acceptance test location might be guessed (e.g. `tests/e2e/`).

**Mitigation:** In **docs/architecture.md** or **docs/ai-development.md**, add explicit examples: *"Unit: `tests/unit/notes.test.ts` for `app/notes/`. Acceptance: `tests/acceptance/` (one file per flow or feature, e.g. `create-note.test.ts`)."*

---

## 9. **Pencil / design tooling**

- **design/pencil.md** describes a mapping to components; the Pencil MCP server instructions say `.pen` files are encrypted and must be read via MCP tools.
- There are no `.pen` files in the tree; only `design/pencil.md` (plain markdown).

**Confusion:** An LLM might treat `design/pencil.md` as the source of design content, or look for `.pen` files and find none, and be unsure how “Pencil” relates to this repo.

**Mitigation:** In **design/pencil.md**, add one line: *"Design assets may live in .pen files (see Pencil MCP). This file is the component mapping only."* That separates “mapping doc” from “design assets”.

---

## 10. **Project name and repo name**

- **README** calls it "Notes App"; the workspace/repo name is **pkb**.
- There’s no explanation of what "pkb" means (e.g. “personal knowledge base”).

**Confusion:** An LLM might use "pkb" in code (e.g. package name, window title) or docs and be inconsistent with "Notes App", or avoid "pkb" entirely.

**Mitigation:** In **README.md**, add one line: *"Repository name: pkb (personal knowledge base). The product name is Notes App."* Or drop "pkb" from user-facing strings and keep it only as repo/package identifier.

---

## Summary

| # | Area | Main risk |
|---|------|-----------|
| 1 | Stack not installed | Assumes stack exists or suggests wrong stack |
| 2 | Missing folders | Unclear whether to create or wait |
| 3 | Design/architecture vs. code | Expects components that don’t exist |
| 4 | AI_RULES vs. project.mdc | Two rule sources, possible drift |
| 5 | `~/` alias | No config in repo; wrong resolution or “broken” repo |
| 6 | `?raw` import | Fails outside Vite/Nuxt; may “fix” with fs |
| 7 | Decisions format | Inconsistent decision entries |
| 8 | Test paths/naming | Wrong placement or naming of tests |
| 9 | Pencil vs. pencil.md | Unclear role of design folder |
| 10 | pkb vs. Notes App | Naming inconsistency in code/docs |

Addressing 1–6 and 8 will have the highest impact for a future LLM that has only the tree and no extra context.

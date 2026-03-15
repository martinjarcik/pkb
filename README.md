# Notes

Notes is an open-source note-taking and personal knowledge base application for  
web and desktop.

The project is intentionally designed to be easy to extend. The goal is not
just to ship a notes app, but to provide a clean foundation that anyone can
grow with AI coding tools such as Claude Code. You do not need to be a
professional developer to contribute new features, but the repository does aim
to keep development structured, predictable, and testable.

Notes stores portable, user-owned data and is currently developed web-first,
with desktop packaging planned through Tauri.

See the [Product Manual](docs/product.md) for product behavior,
[Architecture](docs/architecture.md) for code structure,
[Decisions](docs/decisions.md) for architectural choices, and
[Changelog](CHANGELOG.md) for release history.

## What This Repository Is

This repository contains:

- The application code for Notes.
- A structured workflow for designing and implementing features.
- Rules that help humans and AI agents work safely in the same codebase.

If you are new to the project, the most important thing to know is that this
repo is meant to be extended incrementally. New features should be added
through clear feature specifications that an AI agent can implement safely.

## Getting Started

### Prerequisites

- Node.js >= 22 (see `.nvmrc`)

### Install

```sh
git clone <repo-url> && cd pkb
npm install
```

`npm install` automatically runs `nuxt prepare` to generate Nuxt types in
`.nuxt/` and `husky` to install git hooks.

### Run The App

```sh
npm run dev
```

Then open `http://localhost:3000`.

## How To Develop In This Repo

This project uses a simple spec-driven workflow.

A human maintains the backlog and feature specifications in `docs/features/`.
An AI coding agent then implements the feature from that specification,
including the required code changes, tests, and supporting documentation
updates.

Once the feature is ready, the human tests it and decides whether any follow-up
changes are needed.

If you want to build a feature, start here:

- `[AI_RULES.md](AI_RULES.md)` — coding rules, architectural boundaries, naming,
  testing expectations, and quality constraints. Read this first.
- `[docs/ai-development.md](docs/ai-development.md)` — the agent workflow for
  turning a feature specification into implementation.
- `[docs/features/](docs/features/)` — backlog and per-feature specifications
  maintained by the human.
- `[design/](design/)` — design files and design-to-component mapping.

In practice, the workflow is:

1. Update `docs/features/backlog.md` and create or refine the relevant feature
   spec.
2. Ask the AI agent to implement the feature according to that specification.
3. Test the completed feature and give feedback if anything needs to change.

## Architecture & Tech Stack

Notes is a Nuxt 4 / Vue 3 / TypeScript application styled with Tailwind CSS and
shadcn-vue. Tauri is used for desktop packaging. Configuration is YAML-based.

The codebase keeps a flat structure with clear boundaries between domain logic
and UI:

- `app/notes/`, `app/storage/`, `app/config/` — domain and infrastructure
  logic.
- `app/components/`, `app/composables/`, `app/pages/` — UI and Vue state.

This structure is intentional. It keeps the code easier for both humans and AI
agents to understand and change safely.

## Scripts

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start dev server at `http://localhost:3000` |
| `npm run build`        | Production build                            |
| `npm run preview`      | Preview production build locally            |
| `npm run lint`         | Check for lint errors (ESLint)              |
| `npm run lint:fix`     | Auto-fix lint errors                        |
| `npm run format`       | Format all files (Prettier)                 |
| `npm run format:check` | Check formatting without writing            |
| `npm run typecheck`    | Type-check the project (Nuxt typecheck)     |
| `npm run test:unit`    | Run unit tests in watch mode (Vitest)       |
| `npm run test:unit:ci` | Run unit tests once                         |
| `npm run test:e2e`     | Run end-to-end tests (Playwright)           |
| `npm run test:e2e:ui`  | Run e2e tests with Playwright UI            |

## Code Quality

Quality is enforced automatically via git hooks with Husky:

- **Pre-commit** — `lint-staged` runs ESLint and Prettier on staged files, then
  `npm run typecheck` and `npm run test:unit:ci` run against the full project.
- **Commit message** — commitlint enforces
  [Conventional Commits](https://www.conventionalcommits.org/) format, such as
  `feat: add search` or `fix: note save error`.

## AI Agent Setup

The repository includes explicit support for AI-assisted development:

- `[AI_RULES.md](AI_RULES.md)` is the single source of truth for coding
  conventions, folder boundaries, naming rules, type guidelines, testing
  strategy, complexity constraints, and quality checks.

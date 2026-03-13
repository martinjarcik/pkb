# Notes

A simple, open-source note-taking application for web and desktop.

Repository name: `pkb` (personal knowledge base).

## Goals

- Portable, user-owned note data
- Interoperability across web and desktop (macOS)
- Long-term maintainability
- Predictable structure optimized for LLM-assisted development

## Stack

- Nuxt 4 / Vue 3 / TypeScript
- Tailwind CSS / shadcn-vue
- Tauri for desktop packaging
- YAML-based configuration

## Prerequisites

- Node.js >= 22 (see `.nvmrc`)

## Getting started

```sh
git clone <repo-url> && cd pkb
npm install
```

`npm install` automatically runs `nuxt prepare` (generates types in `.nuxt/`) and `husky` (installs git hooks).

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
| `npm run typecheck`    | Type-check the project (nuxt typecheck)     |
| `npm run test:unit`    | Run unit tests in watch mode (Vitest)       |
| `npm run test:unit:ci` | Run unit tests once                         |
| `npm run test:e2e`     | Run end-to-end tests (Playwright)           |
| `npm run test:e2e:ui`  | Run e2e tests with Playwright UI            |

## Code quality

Quality is enforced automatically via git hooks (Husky):

- **Pre-commit** — lint-staged runs ESLint and Prettier on staged files, then `npm run typecheck` and `npm run test:unit:ci` run against the full project.
- **Commit message** — commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `feat: add search`, `fix: note save error`).

## Development

This project is developed exclusively by LLMs.

Start here: [`AI_RULES.md`](AI_RULES.md)

# Notes

Notes is an open-source note-taking application for web and desktop, designed
as a foundation that anyone can extend with AI coding tools.

The repository keeps development structured, predictable, and testable.

## Getting Started

### Prerequisites

- Node.js >= 22 (see `.nvmrc`)

### Install

```sh
git clone <repo-url>
cd <repo-dir>
npm install
```

`npm install` automatically runs `nuxt prepare` to generate Nuxt types and
`husky` to install git hooks.

### Run The App

```sh
npm run dev
```

Then open `https://localhost:3000`.

Nuxt dev runs over HTTPS by default. Your browser may show a local certificate
warning the first time; continue to the site for localhost development.

If Playwright browsers are not installed yet, run:

```sh
npm run playwright:install
```

## Documentation

| Document                                                   | Purpose                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                     | Coding rules, folder boundaries, naming, testing, quality constraints |
| [docs/ai-development.md](docs/ai-development.md)           | Step-by-step feature implementation workflow                          |
| [docs/architecture.md](docs/architecture.md)               | Domain model and editor design                                        |
| [docs/ubiquitous-language.md](docs/ubiquitous-language.md) | Canonical vocabulary                                                  |
| [docs/decisions.md](docs/decisions.md)                     | Architectural decision records                                        |
| [docs/product.md](docs/product.md)                         | Product manual                                                        |
| [design/design.pen](design/design.pen)                     | Canonical UI design (Pencil file)                                     |

## Scripts

| Command                      | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `npm run dev`                | Start dev server at `https://localhost:3000` |
| `npm run build`              | Production build                             |
| `npm run preview`            | Preview production build locally             |
| `npm run playwright:install` | Install Playwright Chromium locally          |
| `npm run lint`               | Check for lint errors (ESLint)               |
| `npm run lint:fix`           | Auto-fix lint errors                         |
| `npm run format`             | Format all files (Prettier)                  |
| `npm run format:check`       | Check formatting without writing             |
| `npm run typecheck`          | Type-check the project (Nuxt typecheck)      |
| `npm run test:unit`          | Run unit tests in watch mode (Vitest)        |
| `npm run test:unit:ci`       | Run unit tests once                          |
| `npm run test:e2e`           | Run end-to-end tests (Playwright)            |
| `npm run test:e2e:ui`        | Run e2e tests with Playwright UI             |

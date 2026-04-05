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

`npm install` installs frontend and desktop dependencies and `husky` installs
git hooks.

### Run The App

```sh
npm run dev
```

Then open the Vite dev URL shown in the terminal, or run the app through Tauri
once the desktop host is installed.

### macOS desktop installer (DMG)

Prebuilt DMGs for the current app version live under `releases/`. To rebuild them
after changing the desktop app or frontend:

```sh
npm run build:tauri:dmg
```

This runs a production Vite build, then `tauri build` with the `dmg` bundle only.
The script uses `--no-sign` so it works without Apple code-signing credentials;
remove that flag (or run `npx tauri build` from `desktop/tauri`) when you are
ready to sign and notarize.

## Documentation

| Document                                                   | Purpose                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                     | Coding rules, folder boundaries, naming, testing, quality constraints |
| [docs/architecture.md](docs/architecture.md)               | Domain model and editor design                                        |
| [docs/ubiquitous-language.md](docs/ubiquitous-language.md) | Canonical vocabulary                                                  |
| [docs/decisions.md](docs/decisions.md)                     | Architectural decision records                                        |
| [docs/product.md](docs/product.md)                         | Product manual                                                        |
| [design/design.pen](design/design.pen)                     | Canonical UI design (Pencil file)                                     |

## Scripts

| Command                   | Purpose                               |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | Start the Vite dev server             |
| `npm run build`           | Production build                      |
| `npm run preview`         | Preview production build locally      |
| `npm run lint`            | Check for lint errors (ESLint)        |
| `npm run lint:fix`        | Auto-fix lint errors                  |
| `npm run format`          | Format all files (Prettier)           |
| `npm run format:check`    | Check formatting without writing      |
| `npm run typecheck`       | Type-check the project (`vue-tsc`)    |
| `npm run test:unit`       | Run unit tests in watch mode (Vitest) |
| `npm run test:unit:ci`    | Run unit tests once                   |
| `npm run build:tauri:dmg` | Production DMG for macOS (see above)  |

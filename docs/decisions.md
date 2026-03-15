# Decisions

## D001 — 2026-03

Configurable app, not plugin platform.

## D002 — 2026-03

Prefer explicit implementation over generalized modular systems.

## D003 — 2026-03

Keep structure flat and conventional.

## D004 — 2026-03

Use YAML for default config.

## D005 — 2026-03

Keep note domain logic separate from Vue UI code.

## D006 — 2026-03

Theming uses Tailwind CSS custom properties and shadcn-vue. No separate JS token system. Custom themes are CSS variable sets.

## D007 — 2026-03

Domain folders (notes/, storage/, config/) use explicit imports. Nuxt auto-import is reserved for components/, composables/, pages/, layouts/.

## D008 — 2026-03

Stack initialized: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, shadcn-vue. srcDir set to app/. shadcn-vue components go in app/components/ui/, cn() utility in app/lib/utils.ts.

## D009 — 2026-03

Added local dev tooling: ESLint (@nuxt/eslint), Prettier (with tailwindcss plugin), Vitest (with @nuxt/test-utils), nuxt typecheck (uses vue-tsc internally), Husky + lint-staged pre-commit hooks, commitlint (conventional commits), .editorconfig, .nvmrc (Node 22), .env.example.

## D010 — 2026-03

Autonomous AI development workflow. Features are specified in `docs/features/<slug>.md` using a template with user flows, acceptance tests, requirements, and vertical slices (INVEST). Implementation follows a TDD loop per slice. Sub-agents handle slice review and critical review. Complexity constraints enforced via Cursor rule.

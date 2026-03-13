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
Document future-LLM confusion points in docs/review-future-llm.md for self-contained repo onboarding.

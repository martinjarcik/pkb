# Required Workflow

## Mandatory inputs

- `AGENTS.md` and `docs/ai-development.md` are mandatory at full scope for every plan and every code change.
- Treat `AGENTS.md` as the canonical coding-rules contract for this repository.
- Treat `docs/ai-development.md` as the canonical workflow contract for planning and implementation.

## Planning contract

- For any planning request, you must follow the exact Phase 1 -> Phase 2 -> Phase 3 sequence defined in `docs/ai-development.md`.
- Planning output must use the required artifacts and templates from `docs/ai-development.md`.
- Any alternative planning format is invalid.
- Do not skip phases, compress phases together, or substitute your own planning structure.

## Consistency contract

- If a required file is missing, contradictory, or stale, stop and call that out explicitly before proceeding.
- `AI_RULES.md` is not a valid reference in this repository. If another file mentions it, treat that as a repo inconsistency to surface and fix.

## Source of truth

- Coding rules, folder boundaries, naming, testing, and quality constraints live in `AGENTS.md`.
- Planning and implementation workflow lives in `docs/ai-development.md`.
- Architecture and implementation boundaries live in `docs/architecture.md`.
- Canonical terminology lives in `docs/ubiquitous-language.md`.

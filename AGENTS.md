# tstack

A harness-neutral hard fork of pstack: `skills/<name>/SKILL.md` directories plus a user guide in `docs/guide/`. Installed with `npx skills add tacheshun/tstack`. Design: `docs/superpowers/specs/2026-09-30-tstack-design.md`.

## Commands

- `node scripts/check.mjs` validates frontmatter, links, skill references, and banned Cursor-only terms. Every PR must pass it.
- `node --test scripts/*.test.mjs` tests the validator.
- In `skills/marius-mode/scripts/`: `bun install`, `bun run test`, `bun run typecheck`. Run one file with `bun test watch-pr/policy.test.ts`.

## Rules

- Write for any harness. Say "spawn a subagent" and "ask the user", never a specific harness's tool name. Name model roles ("default", "fast", "strongest"), never model slugs.
- Frontmatter keys: `name` (equals the directory), `description`, and optionally `license`, `allowed-tools`, `disable-model-invocation`. Some harnesses ignore `disable-model-invocation`, so write descriptions that only match an explicit request.
- Cross-family model panels go through `skills/interrogate/references/bridge.md`. Never call another vendor's CLI outside it.
- Author skills per `skills/marius-mode/playbooks/authoring-a-skill.md`.
- `marius-mode` is the hub: it routes to `playbooks/` and to the other skills. When you rename or change a skill's contract, update every reference. `check.mjs` catches broken ones.

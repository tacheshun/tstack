# tstack

A harness-neutral hard fork of pstack: `skills/<name>/SKILL.md` directories plus a user guide in `docs/guide/`, installed into Claude Code, Codex, Copilot CLI, and Cursor with `npx skills`. Design and rationale: `docs/superpowers/specs/2026-09-30-tstack-design.md`.

## Commands

- `node scripts/check.mjs` must pass on every PR. It checks frontmatter against the Agent Skills spec, markdown links, backtick `playbooks/`, `references/`, and `scripts/` paths, bold skill references, and banned terms. The rules live in the exported constants at the top of the file.
- `node --test scripts/*.test.mjs` tests the validator. A new check gets a failing test first.
- In `skills/marius-mode/scripts/`: `bun install`, `bun run test`, `bun run typecheck`. Run one file with `bun test watch-pr/policy.test.ts`.
- CI (`.github/workflows/check.yml`) runs all of the above.

## Writing skills

- Write for any harness. Say "spawn a subagent" and "ask the user", never a harness's tool name. Name model roles ("default", "fast", "strongest"), never model slugs. `BANNED_TERMS` in `check.mjs` enforces this. A file that must name a harness path, such as a per-harness table, gets an `ALLOWED_TERMS` entry.
- Frontmatter: `name` (equal to the directory, lowercase letters, digits, and single hyphens, max 64), `description` (max 1024), and optionally `license`, `compatibility`, `metadata`, `allowed-tools`, `disable-model-invocation`.
- Copilot and others ignore `disable-model-invocation` and match descriptions against every prompt. A slash-only skill's description names only its `/command`, quoted request phrases, or "when another skill routes here". Never describe situations ("when doing a large migration").
- Link across skills with markdown links, such as `[the bridge](../interrogate/references/bridge.md)`. `check.mjs` validates those. It does not validate backtick paths that start with `../`.
- Shared facts live in one reference and get linked, not copied. Cross-vendor CLI calls go only through `skills/interrogate/references/bridge.md`. Per-harness transcript locations are in `skills/recall/references/transcripts.md`.
- `marius-mode` is the hub. It routes to `playbooks/` and to the other skills. When you rename a skill or change its contract, update every reference.
- `marius-mode` is public. Never add project names, paths, or excerpts mined from anyone's history.
- Author skills per `skills/marius-mode/playbooks/authoring-a-skill.md`.

## Testing a change live

- Try a skill in a scratch project whose `.claude/skills/<name>` symlinks to this checkout. Then run `claude -p "/<name> ..."` there. Never symlink into `~/.claude/skills`.
- Test installs from the local checkout into a throwaway home: `HOME=$(mktemp -d) npx skills add "$PWD" -g -s '*' -a claude-code codex github-copilot cursor -y`. Codex, Copilot, and Cursor read `~/.agents/skills/`. Claude Code gets symlinks in `~/.claude/skills/`. Script exec bits must survive.
- `copilot skill list` run in that home shows whether Copilot parses every skill. It works offline.
- Bridge tests write `~/.config/tstack/bridge`. Delete it afterward.

## Process

- PRs are stacked, one branch per change. Marius reviews and merges bottom-up with merge commits, never squash. Merged branches auto-delete, which retargets the next PR.

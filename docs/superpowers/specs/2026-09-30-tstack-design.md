# tstack design

Date: 2026-09-30
Status: draft, awaiting review

## Goal

tstack is Marius's personal hard fork of [pstack](https://github.com/cursor/plugins/tree/main/pstack). It keeps pstack's skills and docs and drops the Cursor plugin packaging. It is a plain set of `SKILL.md` skills that installs into any harness that follows the open Agent Skills layout: Claude Code, Codex, GitHub Copilot CLI, Cursor, and others. `/poteto-mode` becomes `/marius-mode`, tailored to how Marius works.

Success criteria:

- `npx skills add tacheshun/tstack` installs every skill into Claude Code and Codex, and the skills load and run there.
- Skill bodies use no Cursor-only tool names, paths, or plugin dependencies. `scripts/check.mjs` enforces this.
- `/marius-mode` routes tasks through the ported playbooks and reflects Marius's mined and interviewed preferences.
- Cloning and using tstack on a work machine does not send code to unapproved model vendors, and it does not write work-derived data into the public repo.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Relation to upstream | Hard fork | The neutral-wording and personalization edits are too deep for merges or a transform script to survive. Pull upstream ideas by hand. |
| Model selection | Host harness's own models, plus an opt-in CLI bridge for cross-family panels | Subagents outside Cursor run only the host vendor's models. The bridge keeps multi-family review where it is allowed. |
| Install | `npx skills add tacheshun/tstack` | It already knows each harness's skills directory, so the repo needs no install code. |
| Dropped from pstack | `agents/`, `assets/`, `automations/`, `.cursor-plugin/`, `skills/make-bot-ui`, `skills/setup-pstack` | Cursor-specific, or obsolete once models are harness-native. `skills/poteto-mode` is not kept as its own skill: its machinery becomes `skills/marius-mode`. |
| Mining source for public marius-mode | All Claude Code and Codex history on the personal machine, plus `~/AGENTS.md` | Gives the most evidence. The output is generalized patterns only. |

## 1. Repo shape

```
skills/<name>/SKILL.md     pstack's skills minus make-bot-ui, setup-pstack; poteto-mode renamed to marius-mode
                           (marius-mode keeps playbooks/, references/, scripts/)
docs/guide/                ported guide, rewritten for tstack
scripts/check.mjs          repo validator (no dependencies)
README.md                  install and usage per harness
CLAUDE.md, AGENTS.md       instructions for agents working on tstack itself
LICENSE                    MIT; keeps pstack's copyright notice next to Marius's
```

There is no plugin manifest. The `skills/<name>/SKILL.md` layout is the whole interface.

## 2. Porting rules

Apply these to every imported skill and doc:

1. **Harness-neutral wording.**
   - `Task` subagent → "spawn a subagent".
   - `AskQuestion` → "ask the user, with a structured multiple-choice tool if the harness has one".
   - `/loop` → "a recurring loop if the harness supports one, otherwise poll until done".
   - `~/.cursor/...` paths → the paths of the harness running the skill.
2. **Model roles, not model slugs.** Say "default model", "fast model", or "strongest model", and let the harness resolve it. Remove every reference to `pstack-models.mdc`. Cross-family panels use the bridge (section 3).
3. **No dangling dependencies.** Rewrite references to `cursor-team-kit` skills (`deslop`, `control-cli`, `control-ui`) and to Cursor's built-in `create-skill` so they point at tstack skills (`unslop`, `no-comments`, the authoring-a-skill playbook), or remove them.
4. **Portable frontmatter.** Use `name`, `description`, and optionally `allowed-tools`. Keep `disable-model-invocation: true` where pstack had it, because Claude Code honors it. Harnesses such as Copilot CLI ignore that field, so write each description narrowly enough to match only explicit requests.
5. **Validation.** `scripts/check.mjs` must pass on every PR. It checks four things:
   - every `SKILL.md` has `name` and `description` frontmatter
   - every referenced relative file exists
   - every cross-skill reference names an existing skill
   - no banned Cursor-only terms appear (`AskQuestion`, `Task tool`, `pstack-models`, `cursor-team-kit`, `create-skill`, `~/.cursor/`, `poteto-mode`, `poteto-agent`)

## 3. CLI bridge

`interrogate`, `arena`, `architect`, and `reflect` get their value from reviewers in different model families. The bridge adds families the host harness lacks by calling other CLIs headless.

- **Config:** `~/.config/tstack/bridge`, a plain text file with one allowed CLI per line (`claude`, `codex`, `copilot`) and `#` comments. It lives outside the repo, so each machine chooses its own list.
- **Default off:** if the file is missing or empty, there is no bridge. Panels then run on host subagents only, with different review lenses. This is the safe default at work.
- **Reference doc:** `skills/interrogate/references/bridge.md` holds, for each CLI:
  - the exact headless command, for example `claude -p --model <m>`, `codex exec`, `copilot -p --model <m> -s --no-ask-user`
  - how to pass the prompt and diff (stdin or a temp file)
  - the timeout
  - the failure rule: drop that panel member and report it

  The panel skills link to this doc instead of restating it.
- **Panel composition:** host subagents, plus one bridged reviewer for each allowed CLI whose model family differs from the host's. `copilot` can cover several families through `--model`.
- **Not built:** no wrapper script, router, or model-slug config.

## 4. marius-mode

1. **Base.** Rename `poteto-mode` to `marius-mode` and port it per section 2, keeping its triggers, principles index, playbooks, reply rules, and scripts. This lands as a mechanical PR, so the personalization diff shows only Marius's changes.
2. **Mine.** The adapted `automate-me` runs parallel subagents over time slices of `~/.claude/projects/*` and `~/.codex` sessions, seeded with `~/AGENTS.md`. Keep only signals seen in two or more slices. Output generalized patterns with no project names, paths, excerpts, or secrets.
3. **Interview.** Run a few structured multiple-choice rounds (response style, autonomy, verification posture, process), then ask one free-form question.
4. **Rewrite.** Change rules where Marius's practice differs from poteto's, and delete playbooks Marius will not use. Marius reviews the full draft before it is committed.

## 5. Adapted automate-me

Other people and other machines can run it, so it must be safe anywhere.

- **Scope prompt.** Offer two scopes: this workspace's transcripts for the current harness (the default), or all of this machine's history (an explicit opt-in). It knows each harness's transcript location: `~/.claude/projects`, `~/.codex`, `~/.copilot`, `~/.cursor/projects`. It verifies each location exists before using it.
- **Destination prompt.** Offer two destinations:
  - the public mode skill in the repo
  - a local layer at `~/.agents/skills/<handle>-work/`, never committed

  If the target is inside a git repo with a remote, it warns before writing anything mined from work data.
- **No Cursor dependencies.** It authors through the tstack authoring-a-skill playbook plus `unslop`.

## 6. Docs

- Port `docs/guide/` and rewrite it around marius-mode, per-harness install and usage, and bridge setup.
- Cut or fold in the chapters about removed features, such as `setup-pstack` and the Cursor model config.
- Write the README fresh in Marius's voice.

## 7. Delivery

Each row is one PR to `tacheshun/tstack` and must be green before the next starts.

| PR | Contents | Verified by |
|---|---|---|
| 1 | Verbatim import of `skills/` (minus `make-bot-ui`, `setup-pstack`) and `docs/`; LICENSE attribution | A clean baseline for later diffs |
| 2 | `scripts/check.mjs`; harness-neutral port of all skills and docs references; `poteto-mode` → `marius-mode` rename | `check.mjs` passes; `bun test` and `bun run typecheck` pass in `skills/marius-mode/scripts` |
| 3 | Bridge reference; panel skills wired to it | A live `interrogate` run with the bridge off, then on (`codex`) |
| 4 | Adapted `automate-me` | A Claude Code dry run that reports the detected scope, paths, and destination |
| 5 | Mining, interview, personalized marius-mode | Marius reviews the draft |
| 6 | Docs guide and README rewrite | `check.mjs` link validation; Marius reads it |

Final end-to-end check:

1. Install with `npx skills add tacheshun/tstack` into a clean temporary home for Claude Code and for Codex.
2. Confirm that the skills are listed.
3. Run `/marius-mode` on a small real task in Claude Code.
4. Marius verifies Copilot CLI on the work machine.

## Environment notes

- Bun is installed at `/opt/homebrew/bin/bun`. It runs the `marius-mode` script tests.
- Work happens in `~/code/tstack`. `~/code/pstack` stays untouched as the reference copy.
- Inside the Claude Code sandbox, `gh` and `git` over HTTPS fail TLS verification, so network git operations run outside the sandbox.

## Out of scope

- Syncing with upstream pstack automatically.
- A Claude Code plugin or marketplace manifest. Add one later only if `npx skills` proves insufficient.
- Porting the `benny` automation pack or the subagent definitions.

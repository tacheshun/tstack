# tstack

My personal set of agent skills for rigorous engineering work. It's a hard fork of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by [poteto](https://x.com/poteto), rebuilt so it isn't tied to one tool: plain `SKILL.md` skills that install into Claude Code, Codex, GitHub Copilot CLI, Cursor, and any other harness that reads the open skills layout.

The main entry point is `/marius-mode`. It reads your request, picks a playbook (bug fix, feature, refactoring, investigation, and about twenty more), runs the other skills as the steps need them, and proves the result on the real app before calling it done.

## Install

```bash
npx skills add tacheshun/tstack -g -s '*' -a claude-code codex github-copilot cursor
```

Drop the harnesses you don't use. The skills land in `~/.agents/skills/`. Codex, Copilot, and Cursor read that folder directly, and Claude Code gets symlinks in `~/.claude/skills/`. Update with `npx skills update -g`.

## Quick start

Give it a goal and a way to check it:

```text
/marius-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

For non-trivial work it writes a short plan and waits for your go. Then it runs to a ready change without checking in, and stops before any push or PR. You merge.

## Skills

| Skill | Use it when |
|---|---|
| `/marius-mode` | Any non-trivial task. Routes to a playbook and applies the principles. |
| `/how` | You want to know how a subsystem works. |
| `/why` | You want to know why something was built this way. Queries your MCP sources. |
| `/teach` | You want to understand a change or subsystem, not only get a summary. |
| `/recall` | You're resuming work and want your recent context rebuilt from chat history. |
| `/blast-radius` | A small-looking change and you want to know what else it could break. |
| `/architect` | You're about to write code that crosses a function boundary. |
| `/arena` | You want several parallel attempts at the same thing, then the best parts of each. |
| `/swarm` | You want parallel workers across slices or races, then one report. |
| `/interrogate` | You want reviewers to try to break a diff. |
| `/tdd` | A bug with a cheap local test path: failing test first, then the fix. |
| `/no-comments` | Strip comments before review. |
| `/unslop` | Clean AI tells out of writing. |
| `/technical-writing` | Docs, READMEs, PR descriptions, commit messages. |
| `/bro` | Restate the last message in plain language. |
| `/figure-it-out` | No playbook fits. Designs an auditable one for the task. |
| `/show-me-your-work` | You want a decision log you can review later. |
| `/reflect` | A long task landed and you want its lessons turned into skill edits. |
| `/automate-me` | You want your own `-mode` skill drafted from how you actually work. |
| `/create-verification-skill` | Your project has no scripted way to prove app behavior. |
| `/maintain-verification-skill` | Your verification skill has drifted from the app. |
| `/typescript-best-practices` | You're reading or editing TypeScript. |

There are also 23 `principle-*` skills, one rule each. `/marius-mode` reads their index and applies the ones a task triggers.

## Cross-vendor review

Review panels such as `/interrogate` can add reviewers from other model families by calling their CLIs headless (`claude`, `codex`, `copilot`). This is off by default. Allow CLIs per machine in `~/.config/tstack/bridge`, one per line, so a work machine can allow only the approved vendor. Details are in [the bridge reference](skills/interrogate/references/bridge.md).

## Learn more

The [tstack guide](docs/guide/README.md) walks through setup, routing, understanding code, design, building, verification, overnight runs, and making the style your own.

To work on tstack itself, run `node scripts/check.mjs` before every PR. It validates frontmatter, links, and skill references, and rejects harness-specific terms.

## License

MIT. Includes work from pstack, copyright Lauren Tan. See [LICENSE](LICENSE).

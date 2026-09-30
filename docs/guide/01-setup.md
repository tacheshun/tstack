# Set up tstack

In this page you install the skills into your harness, optionally turn on cross-vendor review, and run your first task.

## Install the skills

tstack is a folder of standard `SKILL.md` skills, so one installer covers every harness. Run:

```bash
npx skills add tacheshun/tstack -g -s '*' -a claude-code codex github-copilot cursor
```

- `-g` installs for your user, so every project sees the skills. Leave it out to install into the current project only.
- `-s '*'` installs all skills without asking which ones.
- `-a` names the harnesses. Drop the ones you don't use.

The skills land once in `~/.agents/skills/`. Codex, GitHub Copilot, and Cursor read that folder directly. Claude Code gets symlinks in `~/.claude/skills/`. To update later, run `npx skills update -g`.

Check the install in your harness:

| Harness | Check |
|---|---|
| Claude Code | Type `/` and look for `/marius-mode`. |
| Codex | Ask "what skills do you have?" |
| GitHub Copilot CLI | Run `/skills`. |
| Cursor | Type `/` in a chat and look for `/marius-mode`. |

Some harnesses ignore the flag that keeps a skill slash-only. Each skill's description names its own command, so it matches only when you ask for it.

## Models

tstack does not configure models. Each skill names a role (the strongest model, the default model, or a fast one), and your harness picks its own model for that role. In Claude Code that means Opus, Sonnet, or Haiku. In Codex it means OpenAI models.

## Turn on cross-vendor review, or don't

Review panels such as `/interrogate` find more when reviewers come from different model families. Your harness's subagents all come from one vendor, so tstack can add reviewers by calling other vendors' CLIs. It only calls the CLIs you allow on this machine.

Create `~/.config/tstack/bridge` with one CLI per line:

```text
# personal machine
claude
codex
```

```text
# work machine: only the approved vendor
copilot
```

With no file, the bridge is off and panels run on your harness's own models. That default is safe on any machine. The exact commands are in [the bridge reference](../../skills/interrogate/references/bridge.md).

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/marius-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/marius-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

`/marius-mode` applies to the task you invoke it with. Start the next task with `/marius-mode` again when you want the same rigor.

Next: [Route work through `/marius-mode`](./02-marius-mode.md).

# Cross-vendor bridge

Panels (interrogate, arena, architect, reflect) gain a different model family by calling another vendor's CLI headless. Only CLIs listed in the per-machine allowlist may be called.

## Allowlist

Read `~/.config/tstack/bridge`: one CLI name per line (`claude`, `codex`, `copilot`), `#` starts a comment. If the file is missing or lists nothing, there is no bridge: run the panel on host subagents only and say "bridge: off" in the report. Never call a CLI that is not listed, even if it is installed.

## Panel composition

Add one bridged member per listed CLI whose model family differs from the host harness's. `copilot` serves several families through `--model`: pick a family the panel does not already have. Bridged members get the same filled prompt as host members, plus their lens line.

## Commands

Write the filled prompt to a temp file, then run the command with the harness's command timeout set to 600 seconds (macOS has no `timeout` binary):

| CLI | Family | Command |
|---|---|---|
| `claude` | Anthropic | `claude -p --model opus --permission-mode plan < "$prompt_file"` |
| `codex` | OpenAI | `codex exec --sandbox read-only --skip-git-repo-check - < "$prompt_file"` |
| `copilot` | chosen with `--model` | `copilot -p "$(cat "$prompt_file")" --model <model> -s --no-ask-user --deny-tool=write --deny-tool=shell` |

Bridged members are read-only reviewers: every command above runs without write or shell access. Never add flags that grant it.

## Failures

If the command is missing, exits nonzero, or times out, drop that member, name it and the reason in the report ("bridge: copilot dropped, access denied by policy"), and finish the panel with the members that returned.

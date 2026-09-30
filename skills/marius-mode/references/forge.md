# Forge

Resolve the forge once, before the first review-request operation. Use that forge for create, edit, view, watch, and merge. Record the choice and any fallback. Do not require Graphite (`gt`).

## Resolve

Check these in order and stop at the first match.

1. **Origin.** `command -v origin` succeeds and Origin can resolve the repository.
2. **GitHub.** The host of `git remote get-url origin` is `github.com`, or `gh repo view` succeeds for a GitHub Enterprise host.
3. **GitLab.** The remote host is `gitlab.com` or contains `gitlab`, or `glab auth status --hostname <host>` succeeds for a self-hosted instance.

If nothing matches, ask the user which forge the repository uses. If the forge's CLI is missing, tell the user which one to install. Do not fall back to another forge's CLI.

## Name

The forge sets the noun. Use it in chat, titles, and descriptions.

| Forge | Noun | Base branch | CI |
| --- | --- | --- | --- |
| GitHub, Origin | pull request (PR) | base | checks |
| GitLab | merge request (MR) | target branch | pipeline |

The playbooks say "PR" and `<pr>`. On GitLab, read those as MR and `<mr>`.

## Commands

| Operation | Origin | GitHub | GitLab |
| --- | --- | --- | --- |
| Create ready | `origin pr create --status open --base <base>` | `gh pr create --base <base>` | `glab mr create --target-branch <base> --yes` |
| Retarget | `origin pr edit <pr> --base <base>` | `gh pr edit <pr> --base <base>` | `glab mr update <mr> --target-branch <base>` |
| Mark ready | `origin pr ready <pr>` | `gh pr ready <pr>` | `glab mr update <mr> --ready` |
| View | `origin pr view <pr>` | `gh pr view <pr>` | `glab mr view <mr>` |

Pass the description from a file: `--body-file` on `gh`, `--description-file` on `glab`. Never pass `--draft` or `--wip`.

GitLab stacks work the same way as GitHub stacks. A child MR targets its parent's branch. When the parent merges, retarget the child to trunk yourself unless the project retargets it automatically.

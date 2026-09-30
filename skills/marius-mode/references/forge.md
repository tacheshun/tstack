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

## Babysit and ship

`playbooks/babysit.md` and `playbooks/shipping.md` use these. `scripts/watch-pr/watch-pr` reads GitHub only. On Origin and GitLab, poll with the forge's own commands.

| Operation | Origin | GitHub | GitLab |
| --- | --- | --- | --- |
| Status | `origin pr view <pr> --checks --comments` | `scripts/watch-pr/watch-pr` | `glab mr view <mr> --output json` |
| Threads | `origin pr thread list <pr>` | `scripts/watch-pr/watch-pr` | `glab mr view <mr> --unresolved --output json` |
| Watch CI | `origin pr checks <pr> --watch` | `scripts/watch-pr/watch-pr` | `glab ci status --branch <branch> --wait` |
| Reply | `origin pr thread reply <thread-id> <pr> --body-file <file>` | `gh api --method POST "repos/<owner>/<repo>/pulls/<pr>/comments/<comment-id>/replies" --input <payload.json>` | `glab api --method POST projects/:id/merge_requests/<mr>/discussions/<discussion-id>/notes -F body=@<file>` |
| Merge now | `origin pr merge <pr> --squash` | `gh pr merge <pr> --squash` | `glab mr merge <mr> --squash --auto-merge=false --sha <head> --yes` |
| Merge when ready | `origin pr merge <pr> --squash --auto` | `gh pr merge <pr> --squash --auto` | `glab mr merge <mr> --squash --sha <head> --yes` |

Put every reply body in a file. Never interpolate comment text or a reply into a shell command.

`glab mr merge` sets auto-merge by default. Pass `--auto-merge=false` to merge only when the MR is mergeable now. Pass `--sha` with the verified head so a later push cannot land unverified. Drop `--squash` when the project forbids squash.

GitLab state lives in the MR JSON. `detailed_merge_status` is `mergeable` when the MR can merge. Other values name the blocker: `ci_still_running`, `ci_must_pass`, `not_approved`, `discussions_not_resolved`, `conflict`, `need_rebase`, `draft_status`. `state` is `opened`, `merged`, or `closed`. `merged_at` is set once it lands. `merge_when_pipeline_succeeds` is true while auto-merge is armed. `head_pipeline.status` is the pipeline result. If the project uses merge trains, `glab mr merge` adds the MR to the train. Treat the train as a merge queue.

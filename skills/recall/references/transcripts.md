# Transcript locations

Find the current harness's transcripts before reading any. Read only the current workspace's transcripts unless the user explicitly widens the scope. Check that a location exists (`ls`) before using it, and skip missing ones.

| Harness | Files | Current workspace only |
|---|---|---|
| Claude Code | `~/.claude/projects/<slug>/<session-id>.jsonl` | `<slug>` is the workspace's absolute path with every non-alphanumeric character replaced by `-`, so `/Users/you/proj` becomes `-Users-you-proj`. |
| Codex | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`, older ones in `~/.codex/archived_sessions/` | The first line is a `session_meta` event. Keep files whose `payload.cwd` is the workspace path. Skip files whose `payload.source` marks a subagent. |
| Copilot CLI | Session history under `~/.copilot/` (verify the layout on first use) | Filter by the workspace path recorded in each session. |
| Cursor | `~/.cursor/projects/<slug>/agent-transcripts/<uuid>/<uuid>.jsonl` | `<slug>` is the workspace path with the leading slash dropped and each `/` turned into `-`. |

Every line is one JSON event. Order candidates by real modification time (`ls -t`), never by file name.

Skill files an agent read show up as file-read tool calls on a `SKILL.md` path: the repo's `skills/`, `.claude/skills/`, `.github/skills/`, `.agents/skills/`, or a personal directory (`~/.claude/skills/`, `~/.copilot/skills/`, `~/.codex/skills/`, `~/.agents/skills/`, `~/.cursor/skills/`).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { check, parseFrontmatter } from "./check.mjs";

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "tstack-check-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const skill = (name, body = "Body.\n", extra = "") =>
  `---\nname: ${name}\ndescription: "Use for /${name}."\n${extra}---\n\n${body}`;

test("a valid repo has no errors", () => {
  const root = fixture({
    "skills/alpha/SKILL.md": skill("alpha", "See `references/a.md` and the **beta** skill.\n"),
    "skills/alpha/references/a.md": "x\n",
    "skills/beta/SKILL.md": skill("beta"),
  });
  assert.deepEqual(check(root), []);
});

test("parseFrontmatter handles CRLF and folded descriptions", () => {
  const text = "---\r\nname: alpha\r\ndescription: >-\r\n  Use for /alpha.\r\n---\r\nBody\r\n";
  assert.deepEqual(parseFrontmatter(text), { name: "alpha", description: ">- Use for /alpha." });
});

test("missing description is an error", () => {
  const root = fixture({ "skills/alpha/SKILL.md": "---\nname: alpha\n---\nBody\n" });
  assert.deepEqual(check(root), ["skills/alpha/SKILL.md:1: missing description"]);
});

test("name must equal the directory name", () => {
  const root = fixture({ "skills/alpha/SKILL.md": skill("Alpha Mode") });
  assert.deepEqual(check(root), ['skills/alpha/SKILL.md:1: name "Alpha Mode" must equal directory "alpha"']);
});

test("non-portable frontmatter keys are errors", () => {
  const root = fixture({ "skills/alpha/SKILL.md": skill("alpha", "Body.\n", "mode: true\n") });
  assert.deepEqual(check(root), ['skills/alpha/SKILL.md:1: non-portable frontmatter key "mode"']);
});

test("broken markdown links are errors, fenced and external links are ignored", () => {
  const root = fixture({
    "skills/alpha/SKILL.md": skill("alpha", "[ok](references/a.md) [bad](missing.md#x) [web](https://x.dev) [PR](url)\n~~~\n[fenced](nope.md)\n~~~\n"),
    "skills/alpha/references/a.md": "x\n",
  });
  assert.deepEqual(check(root), ["skills/alpha/SKILL.md:6: broken link missing.md"]);
});

test("backtick skill paths resolve from the skill root; placeholders are ignored", () => {
  const root = fixture({
    "skills/alpha/SKILL.md": skill("alpha", "`playbooks/a.md` `playbooks/gone.md` `references/sources/<source>.md` `references/*.md`\n"),
    "skills/alpha/playbooks/a.md": "Also `playbooks/a.md`.\n",
  });
  assert.deepEqual(check(root), ["skills/alpha/SKILL.md:6: missing file playbooks/gone.md"]);
});

test("bold skill references must name an existing skill", () => {
  const root = fixture({
    "skills/alpha/SKILL.md": skill("alpha", "Use the **ghost** skill, the **laziness-protocol** principle skill, and the **principle-laziness-protocol** skills.\n"),
    "skills/principle-laziness-protocol/SKILL.md": skill("principle-laziness-protocol"),
  });
  assert.deepEqual(check(root), ['skills/alpha/SKILL.md:6: unknown skill "ghost"']);
});

test("banned terms are errors unless allowlisted for that file", () => {
  const root = fixture({
    "skills/alpha/SKILL.md": skill("alpha", "Use AskQuestion.\n"),
    "skills/alpha/scripts/x.sh": "ls ~/.cursor/projects\n",
  });
  assert.deepEqual(check(root), [
    'skills/alpha/SKILL.md:6: banned term "AskQuestion"',
    'skills/alpha/scripts/x.sh:1: banned term "~/.cursor/"',
  ]);
  assert.deepEqual(check(root, { "skills/alpha/SKILL.md": ["AskQuestion"], "skills/alpha/scripts/x.sh": ["~/.cursor/"] }), []);
});

test("model slugs are banned terms", () => {
  const root = fixture({ "skills/alpha/SKILL.md": skill("alpha", "Use grok-4.7-xhigh-fast, gpt-5.6-sol-max, or claude-opus-5-5-max.\n") });
  assert.deepEqual(check(root), [
    'skills/alpha/SKILL.md:6: banned term "grok-"',
    'skills/alpha/SKILL.md:6: banned term "gpt-5"',
    'skills/alpha/SKILL.md:6: banned term "claude-opus-"',
  ]);
});

test("cursor-team-kit skill names are banned terms", () => {
  const root = fixture({ "skills/alpha/SKILL.md": skill("alpha", "Run `/deslop`, then drive it with control-ui or control-cli.\n") });
  assert.deepEqual(check(root), [
    'skills/alpha/SKILL.md:6: banned term "deslop"',
    'skills/alpha/SKILL.md:6: banned term "control-ui"',
    'skills/alpha/SKILL.md:6: banned term "control-cli"',
  ]);
});

test("the em dash character is a banned term", () => {
  const root = fixture({ "skills/alpha/SKILL.md": skill("alpha", "Fast \u2014 and wrong.\n") });
  assert.deepEqual(check(root), ['skills/alpha/SKILL.md:6: banned term "\u2014"']);
});

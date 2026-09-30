#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const PORTABLE_KEYS = new Set(["name", "description", "license", "allowed-tools", "disable-model-invocation"]);
export const BANNED_TERMS = [
  "AskQuestion", "Task tool", "subagent_type", "generalPurpose", "pstack-models", "setup-pstack",
  "cursor-team-kit", "create-skill", "~/.cursor/", "poteto-mode", "poteto-agent",
  "grok-", "gpt-5", "claude-opus-",
];
export const TERM_SCAN_ROOTS = ["skills"];
export const ALLOWED_TERMS = {
  "skills/recall/references/transcripts.md": ["~/.cursor/"],
};
const SCANNED_EXTENSIONS = /\.(md|sh|ts|mjs|tsv)$/;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function lines(text) {
  return text.replace(/\r\n/g, "\n").split("\n");
}

export function parseFrontmatter(text) {
  const all = lines(text);
  if (all[0] !== "---") return null;
  const end = all.indexOf("---", 1);
  if (end === -1) return null;
  const fields = {};
  let key = null;
  for (const line of all.slice(1, end)) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (match) {
      key = match[1];
      fields[key] = match[2].trim();
    } else if (key && /^\s+\S/.test(line)) {
      fields[key] = `${fields[key]} ${line.trim()}`.trim();
    }
  }
  return fields;
}

function unfencedLines(text) {
  let fenced = false;
  return lines(text).map((line) => {
    if (/^\s*(`{3}|~{3})/.test(line)) {
      fenced = !fenced;
      return "";
    }
    return fenced ? "" : line;
  });
}

function checkSkillFrontmatter(root, dir, errors) {
  const rel = `skills/${dir}/SKILL.md`;
  const path = join(root, rel);
  if (!existsSync(path)) return errors.push(`${rel}:1: missing SKILL.md`);
  const fields = parseFrontmatter(readFileSync(path, "utf8"));
  if (!fields) return errors.push(`${rel}:1: missing frontmatter`);
  if (fields.name !== dir) errors.push(`${rel}:1: name "${fields.name ?? ""}" must equal directory "${dir}"`);
  if (!fields.description) errors.push(`${rel}:1: missing description`);
  for (const key of Object.keys(fields)) {
    if (!PORTABLE_KEYS.has(key)) errors.push(`${rel}:1: non-portable frontmatter key "${key}"`);
  }
}

function checkReferences(root, rel, text, skills, errors) {
  const abs = join(root, rel);
  const parts = rel.split("/");
  const skillRoot = parts[0] === "skills" && parts.length > 2 ? join(root, "skills", parts[1]) : null;
  unfencedLines(text).forEach((line, index) => {
    const at = `${rel}:${index + 1}:`;
    for (const [, target] of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || !/[./]/.test(target)) continue;
      const path = target.split("#")[0];
      if (!existsSync(resolve(dirname(abs), path))) errors.push(`${at} broken link ${path}`);
    }
    if (skillRoot) {
      for (const [, path] of line.matchAll(/`((?:playbooks|references|scripts)\/[^`\s]+)`/g)) {
        if (/[<*]/.test(path)) continue;
        if (!existsSync(join(skillRoot, path)) && !existsSync(resolve(dirname(abs), path))) {
          errors.push(`${at} missing file ${path}`);
        }
      }
    }
    for (const [, name, principle] of line.matchAll(/\*\*([a-z0-9-]+)\*\* (principle )?skills?\b/g)) {
      const dir = principle && !name.startsWith("principle-") ? `principle-${name}` : name;
      if (!skills.has(dir)) errors.push(`${at} unknown skill "${name}"`);
    }
  });
}

function checkTerms(rel, text, allowed, errors) {
  const permitted = allowed[rel] ?? [];
  lines(text).forEach((line, index) => {
    for (const term of BANNED_TERMS) {
      if (line.includes(term) && !permitted.includes(term)) errors.push(`${rel}:${index + 1}: banned term "${term}"`);
    }
  });
}

export function check(root, allowed = ALLOWED_TERMS) {
  const errors = [];
  const skillsDir = join(root, "skills");
  const skillDirs = existsSync(skillsDir)
    ? readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name)
    : [];
  const skills = new Set(skillDirs);
  for (const dir of skillDirs) checkSkillFrontmatter(root, dir, errors);
  const files = [...walk(skillsDir), ...walk(join(root, "docs", "guide"))];
  for (const path of files) {
    const rel = relative(root, path).split(sep).join("/");
    if (!SCANNED_EXTENSIONS.test(rel)) continue;
    const text = readFileSync(path, "utf8");
    if (rel.endsWith(".md")) checkReferences(root, rel, text, skills, errors);
    if (TERM_SCAN_ROOTS.some((scanRoot) => rel.startsWith(`${scanRoot}/`))) checkTerms(rel, text, allowed, errors);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const errors = check(root);
  for (const error of errors) console.log(error);
  if (errors.length > 0) {
    console.log(`check: ${errors.length} error(s)`);
    process.exit(1);
  }
  const skillCount = readdirSync(join(root, "skills"), { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).length;
  console.log(`check: ok (${skillCount} skills)`);
}

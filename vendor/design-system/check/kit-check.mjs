#!/usr/bin/env node
// sam-design-check: Lanes' "the kit stays plug and play" test
// (app/ui/src/components/ui/kit.test.ts) as a command a project runs on its
// own source. It fails on a hand-rolled building block the kit already has:
// a raw <button>/<input>/<textarea>, a hex or rgb()/hsl() colour, a colour in
// `style`, an arbitrary Tailwind value (text-[13px], bg-[#fff]) or a local
// spinner. The rules and their regular expressions are kit.test.ts's, verbatim.
//
//   npx sam-design-check src                       scan src/ (the default)
//   npx sam-design-check src app --exempt src/ui/  more roots; prefixes to skip
//   npx sam-design-check --baseline kit-baseline.json
//        today's offenders in a project adopting the kit: passes while no
//        file has more than the baseline allows. The baseline only shrinks:
//   npx sam-design-check --baseline kit-baseline.json --shrink
//        lowers counts to today's and drops files at zero (never raises one).
//   npx sam-design-check --baseline kit-baseline.json --init
//        writes the first baseline (once; refuses if the file exists).
//
// Exit 0 when clean, 1 on a new offence (each printed as file:line with the
// component to use), 2 on bad arguments. `import { scan, RULES } from
// "@sam/design-system/check"` gives the same scan to a test runner.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function all(pattern) {
  return (code) =>
    [...code.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))].map(
      (match) => match.index ?? 0,
    );
}

/** Colour properties a `style={{...}}` object must not set: a colour is a token, through a class. */
const STYLE_COLOUR =
  /\b(?:color|background|backgroundColor|backgroundImage|border(?:Top|Right|Bottom|Left)?Color|fill|stroke|outlineColor|boxShadow|caretColor|accentColor|textShadow)\s*:/;

function styleColours(code) {
  const found = [];
  for (const match of code.matchAll(/style=\{\{/g)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 2;
    let end = start;
    while (end < code.length && depth > 0) {
      const char = code[end];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      end += 1;
    }
    if (STYLE_COLOUR.test(code.slice(start, end))) found.push(match.index ?? 0);
  }
  for (const match of code.matchAll(/\.style\.(?:color|background\w*|borderColor|fill|stroke|boxShadow)\s*=/g))
    found.push(match.index ?? 0);
  return found;
}

const TSX = /\.(?:tsx|jsx)$/;
const CODE = /\.(?:ts|tsx|js|jsx)$/;
const STYLES = /\.(?:ts|tsx|js|jsx|css)$/;

export const RULES = [
  { id: "raw-button", fix: "Button, IconButton, SortButton, Chip, Segmented or ChoiceCards", files: TSX, find: all(/<button\b/) },
  { id: "raw-input", fix: "Input, Checkbox, Switch, Select, or FilePicker for a file", files: TSX, find: all(/<input\b/) },
  { id: "raw-textarea", fix: "Textarea", files: TSX, find: all(/<textarea\b/) },
  {
    id: "hex-colour",
    fix: "a colour token through its utility (bg-primary, text-muted-foreground; references/tokens.md)",
    files: STYLES,
    find: all(/(?<![\w&$/#-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/),
  },
  {
    id: "rgb-colour",
    fix: "a colour token through its utility (references/tokens.md)",
    files: STYLES,
    find: all(/(?<![\w-])(?:rgba?|hsla?)\(/),
  },
  {
    id: "inline-style-colour",
    fix: "a variant of the kit component (a colour is a token, set by a class)",
    files: TSX,
    find: styleColours,
  },
  {
    id: "arbitrary-value",
    fix: "the token utility (text-xs, size-2, rounded-card, shadow-raised) or a kit variant",
    files: CODE,
    find: (code) =>
      [
        ...code.matchAll(
          /(?<![\w-])(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*)-\[[^\]\s"'`]+\](?![\w:-]|\/[\w-]*:)|(?<![\w\]&-])\[-{0,2}[a-z][a-z-]*:[^\]\s"'`]+\](?![\w:-]|\/[\w-]*:)/g,
        ),
      ]
        .filter((match) => !/^(?:grid-cols|grid-rows|transition|will-change)$/.test(match[1] ?? ""))
        .map((match) => match.index ?? 0),
  },
  {
    id: "local-spinner",
    fix: "Spinner for ordinary waiting, Radar for an agent's work, Button's `loading`",
    files: STYLES,
    find: all(/(?<![\w-])(?:visible-)?animate-spin\b|\bLoader(?:Circle|2)?Icon\b|@keyframes\s+[\w-]*spin\b/),
  },
];

/** The code without its comments (/* *\/, {/* *\/} and // to the end of a line), positions kept. */
export function stripComments(text) {
  const blank = (part) => part.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (match, lead) => lead + blank(match.slice(lead.length)));
}

function lineOf(text, index) {
  let line = 1;
  for (let at = 0; at < index; at += 1) if (text.charCodeAt(at) === 10) line += 1;
  return line;
}

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", ".next", "coverage"]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** Every offence under `roots` (paths relative to `cwd`), skipping test files and `exempt` prefixes. */
export function scan({ roots = ["src"], exempt = [], cwd = process.cwd() } = {}) {
  const counts = Object.fromEntries(RULES.map((rule) => [rule.id, {}]));
  const offences = [];
  const files = roots
    .flatMap((root) => (existsSync(resolve(cwd, root)) ? walk(resolve(cwd, root), []) : []))
    .map((abs) => relative(cwd, abs).split(sep).join("/"))
    .filter((name) => STYLES.test(name) && !/\.(?:test|spec)\.[jt]sx?$/.test(name) && !/\.d\.ts$/.test(name))
    .filter((name) => !exempt.some((prefix) => name.startsWith(prefix)))
    .sort();
  for (const file of files) {
    const text = readFileSync(join(cwd, file), "utf8");
    const code = stripComments(text);
    const lines = text.split("\n");
    for (const rule of RULES) {
      if (!rule.files.test(file)) continue;
      const hits = rule.find(code);
      if (!hits.length) continue;
      counts[rule.id][file] = hits.length;
      for (const index of hits) {
        const line = lineOf(code, index);
        offences.push({ rule: rule.id, file, line, text: (lines[line - 1] ?? "").trim().slice(0, 140) });
      }
    }
  }
  return { counts, offences };
}

function main(argv) {
  const roots = [];
  const exempt = [];
  let baselineFile = null;
  let shrink = false;
  let init = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--exempt") exempt.push(...(argv[++i] ?? "").split(",").filter(Boolean));
    else if (arg === "--baseline") baselineFile = argv[++i] ?? null;
    else if (arg === "--shrink") shrink = true;
    else if (arg === "--init") init = true;
    else if (arg === "-h" || arg === "--help") {
      console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 22).join("\n").replace(/^\/\/ ?/gm, ""));
      return 0;
    } else if (arg.startsWith("-")) {
      console.error(`sam-design-check: unknown option ${arg}`);
      return 2;
    } else roots.push(arg);
  }
  if (!roots.length) roots.push("src");
  if ((shrink || init) && !baselineFile) {
    console.error("sam-design-check: --shrink and --init need --baseline <file>");
    return 2;
  }
  const { counts, offences } = scan({ roots, exempt });
  if (init) {
    if (existsSync(baselineFile)) {
      console.error(`sam-design-check: ${baselineFile} exists; a baseline is written once, then only shrinks`);
      return 2;
    }
    const about = "Hand-rolled building blocks outside the kit, per rule and file (sam-design-check). Counts only go down: --shrink.";
    writeFileSync(baselineFile, `${JSON.stringify({ about, rules: counts }, null, 2)}\n`);
    console.log(`sam-design-check: wrote ${baselineFile} (${offences.length} offences)`);
    return 0;
  }
  const baseline = baselineFile && existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : { rules: {} };
  if (shrink) {
    const next = {};
    for (const rule of RULES) {
      const kept = {};
      for (const [file, allowed] of Object.entries(baseline.rules[rule.id] ?? {})) {
        const now = Math.min(allowed, counts[rule.id]?.[file] ?? 0);
        if (now > 0) kept[file] = now;
      }
      next[rule.id] = kept;
    }
    baseline.rules = next;
    writeFileSync(baselineFile, `${JSON.stringify(baseline, null, 2)}\n`);
  }
  const fresh = [];
  const stale = [];
  for (const rule of RULES) {
    for (const [file, count] of Object.entries(counts[rule.id] ?? {})) {
      const allowed = baseline.rules[rule.id]?.[file] ?? 0;
      if (count <= allowed) continue;
      const where = offences.filter((offence) => offence.rule === rule.id && offence.file === file);
      fresh.push(
        `${rule.id} in ${file}: ${count}${allowed ? ` (the baseline allows ${allowed})` : ""}. Use ${rule.fix}.\n` +
          where.map((offence) => `    ${file}:${offence.line}  ${offence.text}`).join("\n"),
      );
    }
    for (const [file, allowed] of Object.entries(baseline.rules[rule.id] ?? {})) {
      const now = counts[rule.id]?.[file] ?? 0;
      if (now < allowed) stale.push(`${rule.id} in ${file}: ${now}, the baseline says ${allowed}`);
    }
  }
  if (fresh.length) {
    console.error(`Use the kit (@sam/design-system, skills/sam-design-system/references/components.md):\n${fresh.join("\n")}`);
    return 1;
  }
  if (stale.length) {
    console.error(`Fewer hand-rolled pieces than the baseline allows. Lock that in with --shrink:\n${stale.join("\n")}`);
    return 1;
  }
  console.log(`sam-design-check: clean (${roots.join(", ")})`);
  return 0;
}

// Run as a command (directly, or through node_modules/.bin's symlink), not when imported.
const invoked = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (invoked) process.exitCode = main(process.argv.slice(2));

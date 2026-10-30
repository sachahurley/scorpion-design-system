#!/usr/bin/env node
/**
 * gen-changelog-index.mjs <scorp-ds dir> <git ref> <output path> [previous output]
 *
 * Builds the Changelog page from scorp-ds itself, so the page cannot fall
 * behind the code it describes: vendor:ds writes the JSON on every re-vendor
 * and ds:check flags drift as soon as scorp-ds merges anything new.
 *
 * Two sources:
 *
 *   changes   every merged pull request on scorp-ds main (first-parent history
 *             at <ref>, one entry per "(#N)" commit), tagged by whether it
 *             changed what the consumer sites vendor. The three sites copy the
 *             component source (or its build) and the token package, so a PR
 *             that touches packages/components/src or packages/tokens, outside
 *             tests, ships; everything else (specs, decisions, CI, stories,
 *             tooling) stays in the repo.
 *
 *   audit     the agent-readiness scorecard: the latest monthly audit comment
 *             on scorp-ds issue #136, with the original audit's scores from
 *             the issue body for comparison. This one is read over the network.
 *             If GitHub cannot be reached and a previous index is passed in,
 *             its audit block is kept and a warning printed: the page shows the
 *             audit's date, so a stale scorecard is visible rather than silent.
 *
 * Like the other generators here, nothing fails softly: a parse that finds no
 * pull requests or not exactly nine criteria exits non-zero rather than
 * writing an empty page.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [dsDir, ref, outPath, prevPath] = process.argv.slice(2);
if (!dsDir || !ref || !outPath) {
  console.error("usage: gen-changelog-index.mjs <scorp-ds dir> <git ref> <output path> [previous output]");
  process.exit(1);
}

const REPO = "sachahurley/scorp-ds";
const AUDIT_ISSUE = 136;
const git = (...args) =>
  execFileSync("git", ["-C", dsDir, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const fail = (msg) => {
  console.error(`gen-changelog-index: ${msg}`);
  process.exit(1);
};

// ─── changes ───────────────────────────────────────────────────────────────

/** True when a path is part of what the consumer sites vendor. */
const isTest = (p) => p.includes("/__tests__/") || /\.test\.[tj]sx?$/.test(p);
const ships = (p) =>
  !isTest(p) &&
  (p.startsWith("packages/components/src/") ||
    p === "packages/components/package.json" ||
    p.startsWith("packages/tokens/src/") ||
    p === "packages/tokens/tailwind.preset.js" ||
    p === "packages/tokens/package.json");

/** What a shipping PR touched, named the way a reader of the site would. */
function areasOf(paths) {
  const names = new Set();
  let tokens = false;
  let lib = false;
  for (const p of paths.filter(ships)) {
    const m = p.match(/^packages\/components\/src\/(?:components|primitives)\/([A-Za-z]+)\.tsx$/);
    if (m) names.add(m[1]);
    else if (p.startsWith("packages/tokens/")) tokens = true;
    else if (p.startsWith("packages/components/src/lib/")) lib = true;
  }
  return [...[...names].sort(), ...(tokens ? ["tokens"] : []), ...(lib ? ["lib"] : [])];
}

// %x1e starts a record, so a subject containing a tab or newline cannot split one.
const log = git(
  "log",
  "--first-parent",
  "--diff-merges=first-parent",
  "--name-only",
  "--date=short",
  "--format=%x1e%h%x09%ad%x09%s",
  ref,
);

const changes = log
  .split("\x1e")
  .filter(Boolean)
  .map((record) => {
    const [head, ...files] = record.split("\n");
    const [sha, date, subject] = head.split("\t");
    const pr = subject.match(/\s\(#(\d+)\)$/);
    if (!pr) return null; // a direct push to main, from before the PR workflow
    const paths = files.filter(Boolean);
    const shipped = paths.some(ships);
    return {
      pr: Number(pr[1]),
      title: subject.slice(0, pr.index),
      date,
      sha,
      ships: shipped,
      areas: shipped ? areasOf(paths) : [],
      url: `https://github.com/${REPO}/pull/${pr[1]}`,
    };
  })
  .filter(Boolean);

if (changes.length === 0) fail(`found no merged pull requests at ${ref}. Refusing to write an empty changelog.`);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const months = [];
for (const c of changes) {
  const key = c.date.slice(0, 7);
  if (months.at(-1)?.month !== key) {
    const [y, m] = key.split("-");
    months.push({ month: key, label: `${MONTHS[Number(m) - 1]} ${y}`, changes: [] });
  }
  months.at(-1).changes.push(c);
}

// ─── audit ─────────────────────────────────────────────────────────────────

/** The rubric's nine criteria. The audit agent abbreviates them, so the page
 *  names them from here and reads only the number and the score. */
const CRITERIA = [
  "Machine-readable source of truth",
  "Explicit, typed APIs",
  "Documentation colocated with code",
  "Composition rules",
  "Deterministic naming",
  "Enforceable constraints",
  "Discoverability from inside the agent loop",
  "Clear extension path",
  "Single source, generated derivatives",
];

function token() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null; // scorp-ds is public; unauthenticated reads work, rate-limited
  }
}

async function github(path) {
  const t = token();
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: { Accept: "application/vnd.github+json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

/** Score per criterion number from the first markdown table that has all nine.
 *  Reads both layouts in use: the baseline's `| 1 | Name | 3 |` and the
 *  audit's `| 1 Name | 3 | change | why |`. */
function scores(md) {
  const found = new Map();
  for (const line of md.split("\n")) {
    if (!/^\|/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    let n, score;
    if (/^\d$/.test(cells[0])) [n, score] = [Number(cells[0]), parseInt(cells[2], 10)];
    else if (/^\d\s/.test(cells[0])) [n, score] = [Number(cells[0][0]), parseInt(cells[1], 10)];
    if (n >= 1 && n <= 9 && score >= 0 && score <= 3 && !found.has(n)) found.set(n, score);
  }
  return found.size === 9 ? CRITERIA.map((_, i) => found.get(i + 1)) : null;
}

async function audit() {
  const issue = await github(`issues/${AUDIT_ISSUE}`);
  const original = (issue.body.match(/original audit:\s*([\d,\s]+)\)/) || [])[1]?.split(/[,\s]+/).filter(Boolean).map(Number);
  if (!original || original.length !== 9) fail(`issue #${AUDIT_ISSUE} body has no nine-score "original audit" list.`);

  const comments = await github(`issues/${AUDIT_ISSUE}/comments?per_page=100`);
  const reports = comments.filter((c) => /^##\s+Audit\s+\d{4}-\d{2}-\d{2}/m.test(c.body));
  const latest = reports.at(-1);
  // Before the first monthly run, the baseline in the issue body is the latest score.
  const source = latest ? latest.body : issue.body;
  const latestScores = scores(source);
  if (!latestScores) fail(`could not read nine criterion scores from ${latest ? latest.html_url : `issue #${AUDIT_ISSUE}`}.`);

  const heading = latest?.body.match(/^##\s+Audit\s+(\d{4}-\d{2}-\d{2})(?:\s+at\s+([0-9a-f]{7,}))?/m);
  const verdict = latest
    ? (latest.body.split(/^###\s+Pass condition\s*$/m)[1] || "").trim().split(/[:.\n]/)[0].trim()
    : (issue.body.match(/\*\*((?:Not |Mostly |Partly )?[Mm]et)\*\*/) || [])[1];

  return {
    issue: issue.html_url,
    report: latest ? latest.html_url : issue.html_url,
    date: heading ? heading[1] : (issue.body.match(/Baseline \((\d{4}-\d{2}-\d{2})\)/) || [])[1] ?? null,
    commit: heading?.[2] ?? null,
    kind: latest ? "monthly audit" : "baseline",
    passCondition: verdict || null,
    criteria: CRITERIA.map((name, i) => ({ n: i + 1, name, original: original[i], latest: latestScores[i] })),
  };
}

let auditBlock;
try {
  auditBlock = await audit();
} catch (err) {
  const prev = prevPath && existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, "utf8")).audit : null;
  if (!prev) fail(`could not read the audit from GitHub (${err.message}) and there is no previous index to keep.`);
  console.error(`warn: could not read the audit from GitHub (${err.message}); keeping the scorecard from ${prev.date}`);
  auditBlock = prev;
}

// ─── write ─────────────────────────────────────────────────────────────────

const shipped = changes.filter((c) => c.ships).length;
const index = {
  _comment: "Generated by scripts/gen-changelog-index.mjs during vendor:ds. Do not edit by hand.",
  source: `https://github.com/${REPO}`,
  links: {
    pulls: `https://github.com/${REPO}/pulls?q=is%3Apr+is%3Amerged`,
    commits: `https://github.com/${REPO}/commits/main`,
    vision: `https://github.com/${REPO}/blob/main/docs/vision.md`,
    readinessAudit: `https://github.com/${REPO}/blob/main/docs/insights/2026-10-28-agent-readiness-audit.md`,
  },
  counts: { changes: changes.length, shipped, repoOnly: changes.length - shipped },
  first: changes.at(-1).date,
  audit: auditBlock,
  months,
};

writeFileSync(outPath, JSON.stringify(index, null, 2) + "\n");

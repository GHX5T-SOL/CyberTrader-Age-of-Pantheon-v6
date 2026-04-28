import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const DIST_DIR = join(ROOT, "dist");

const MiB = 1024 * 1024;
const KiB = 1024;

const budgets = [
  {
    id: "web-export-total",
    label: "Web export total",
    owner: "Axiom/Rune",
    minimum: 1,
    limit: 30 * MiB,
    measure: () => sumBytes(DIST_DIR),
  },
  {
    id: "web-entry-js-raw",
    label: "Main web JS raw",
    owner: "Rune/Vex",
    minimum: 1,
    limit: 2.8 * MiB,
    measure: () => sumMatchingBytes(DIST_DIR, (file) => file.endsWith(".js")),
  },
  {
    id: "web-entry-js-gzip",
    label: "Main web JS gzip",
    owner: "Rune/Vex",
    minimum: 1,
    limit: 700 * KiB,
    measure: () => sumMatchingGzipBytes(DIST_DIR, (file) => file.endsWith(".js")),
  },
  {
    id: "intro-cinematic-media",
    label: "Intro cinematic media",
    owner: "Reel/Palette",
    minimum: 1,
    limit: 24 * MiB,
    measure: () => sumMatchingBytes(DIST_DIR, (file) => file.endsWith(".mp4")),
  },
  {
    id: "optimized-active-art",
    label: "Optimized active art",
    owner: "Palette/Zara",
    minimum: 1,
    limit: 1.5 * MiB,
    measure: () => sumBytes(join(DIST_DIR, "assets", "assets", "optimized")),
  },
];

if (!existsSync(DIST_DIR)) {
  fail(`Missing ${relative(ROOT, DIST_DIR)}. Run npm run build:web before checking budgets.`);
}

const results = budgets.map((budget) => {
  const value = budget.measure();
  const pass = value >= budget.minimum && value <= budget.limit;

  return {
    ...budget,
    value,
    pass,
  };
});

for (const result of results) {
  const state = result.pass ? "PASS" : "FAIL";
  console.log(
    `${state} ${result.id}: ${formatBytes(result.value)} / ${formatBytes(result.limit)} (${result.owner})`,
  );
}

const failures = results.filter((result) => !result.pass);

if (failures.length > 0) {
  console.error("");
  for (const failure of failures) {
    if (failure.value < failure.minimum) {
      console.error(
        `Budget evidence missing: ${failure.label} measured ${formatBytes(failure.value)}; owner ${failure.owner} must verify the asset group is present.`,
      );
    } else {
      console.error(
        `Budget exceeded: ${failure.label} is ${formatBytes(failure.value)}; owner ${failure.owner} must reduce it below ${formatBytes(failure.limit)}.`,
      );
    }
  }
  process.exit(1);
}

function walkFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function sumBytes(directory) {
  return walkFiles(directory).reduce((total, file) => total + statSync(file).size, 0);
}

function sumMatchingBytes(directory, predicate) {
  return walkFiles(directory)
    .filter(predicate)
    .reduce((total, file) => total + statSync(file).size, 0);
}

function sumMatchingGzipBytes(directory, predicate) {
  return walkFiles(directory)
    .filter(predicate)
    .reduce((total, file) => total + gzipSync(readFileSync(file), { level: 9 }).length, 0);
}

function formatBytes(bytes) {
  if (bytes >= MiB) {
    return `${(bytes / MiB).toFixed(2)} MiB`;
  }

  return `${(bytes / KiB).toFixed(1)} KiB`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

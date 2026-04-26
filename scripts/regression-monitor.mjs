#!/usr/bin/env node
// Automated post-push regression detection for CyberTrader v6.
// Fetches origin/main and runs the regression suite whenever new commits appear.
// State is persisted in .git/regression-state.json (not tracked by git).
//
// Monitor mode (default): run suite only when origin/main has advanced.
// Force mode (--force):   always run the full suite regardless of commit state.
//
// Exit 0 = pass or skip (no new commits). Exit 1 = regression detected or error.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FORCE_MODE = process.argv.includes("--force");

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

const stateFile = path.join(repoRoot, ".git", "regression-state.json");

function git(args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function runCmd(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim().slice(0, 3000),
    stderr: (result.stderr || "").trim().slice(0, 1000),
    status: result.status ?? -1,
  };
}

function readState() {
  try {
    if (existsSync(stateFile)) {
      return JSON.parse(readFileSync(stateFile, "utf8"));
    }
  } catch {
    // corrupt state — start fresh
  }
  return { lastCheckedCommit: null, lastRunAt: null, lastResult: null };
}

function writeState(state) {
  writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
}

function fetchOrigin() {
  try {
    execFileSync("git", ["fetch", "origin", "--quiet"], {
      cwd: repoRoot,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function getRemoteHead() {
  try {
    return git(["rev-parse", "origin/main"]);
  } catch {
    return null;
  }
}

function runRegressionSuite() {
  const startedAt = new Date().toISOString();
  const steps = [];

  const tc = runCmd("npm", ["run", "typecheck"]);
  steps.push({ step: "typecheck", ok: tc.ok, stderr: tc.stderr });

  const jest = runCmd("npm", ["test", "--", "--runInBand", "--forceExit"]);
  steps.push({ step: "jest", ok: jest.ok, stdout: jest.stdout });

  const health = runCmd("npm", ["run", "health:live"]);
  steps.push({ step: "health:live", ok: health.ok, stdout: health.stdout });

  return {
    ok: steps.every((s) => s.ok),
    startedAt,
    finishedAt: new Date().toISOString(),
    steps,
  };
}

function main() {
  const state = readState();
  const fetchOk = fetchOrigin();
  const remoteHead = getRemoteHead();
  const now = new Date().toISOString();

  if (!fetchOk || !remoteHead) {
    const result = {
      ok: false,
      runId: now,
      skipped: false,
      error: "git fetch or origin/main rev-parse failed — network or upstream issue",
      lastCheckedCommit: state.lastCheckedCommit,
    };
    console.log(JSON.stringify(result, null, 2));
    writeState({ ...state, lastRunAt: now, lastResult: result });
    process.exit(1);
  }

  const hasNewCommits = FORCE_MODE || state.lastCheckedCommit !== remoteHead;

  if (!hasNewCommits) {
    const result = {
      ok: true,
      runId: now,
      skipped: true,
      reason: "no new commits on origin/main since last check",
      checkedCommit: remoteHead,
      lastRunAt: state.lastRunAt,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const suite = runRegressionSuite();
  const result = {
    ok: suite.ok,
    runId: now,
    skipped: false,
    forceMode: FORCE_MODE,
    previousCommit: state.lastCheckedCommit,
    checkedCommit: remoteHead,
    startedAt: suite.startedAt,
    finishedAt: suite.finishedAt,
    steps: suite.steps,
  };

  writeState({ lastCheckedCommit: remoteHead, lastRunAt: now, lastResult: result });
  console.log(JSON.stringify(result, null, 2));
  process.exit(suite.ok ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

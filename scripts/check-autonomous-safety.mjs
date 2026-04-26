#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const maxScanBytes = 2 * 1024 * 1024;
const selfPath = "scripts/check-autonomous-safety.mjs";

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.allowFailure ? "pipe" : "inherit"],
  }).trim();
}

function gitMaybe(args) {
  try {
    return git(args, { allowFailure: true });
  } catch {
    return "";
  }
}

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function splitLines(value) {
  return value ? value.split(/\r?\n/).filter(Boolean) : [];
}

function parseArg(name) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function hasUpstream() {
  return Boolean(gitMaybe(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]));
}

function changedFilesFromRange(range) {
  return splitLines(gitMaybe(["diff", "--name-only", "--diff-filter=ACMRT", range]));
}

function changedFilesFromWorkingTree() {
  const staged = splitLines(gitMaybe(["diff", "--cached", "--name-only", "--diff-filter=ACMRT"]));
  const working = splitLines(gitMaybe(["diff", "--name-only", "--diff-filter=ACMRT"]));
  const untracked = splitLines(gitMaybe(["ls-files", "--others", "--exclude-standard"]));
  return unique([...staged, ...working, ...untracked]);
}

function getChangedFiles() {
  const explicitRange = parseArg("--range");
  if (explicitRange) {
    return changedFilesFromRange(explicitRange);
  }

  if (hasUpstream()) {
    const ahead = Number.parseInt(gitMaybe(["rev-list", "--count", "@{upstream}..HEAD"]) || "0", 10);
    if (ahead > 0) {
      return changedFilesFromRange("@{upstream}..HEAD");
    }
  }

  return changedFilesFromWorkingTree();
}

function readTextFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  const stat = statSync(absolutePath);
  if (!stat.isFile() || stat.size > maxScanBytes) {
    return null;
  }

  try {
    return readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

function isPlaceholder(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "false" ||
    normalized === "true" ||
    normalized === "local" ||
    normalized === "placeholder" ||
    normalized === "changeme" ||
    normalized === "replace_me" ||
    normalized === "your_value_here" ||
    normalized.startsWith("your_") ||
    normalized.startsWith("replace-") ||
    normalized.includes("example") ||
    normalized.includes("placeholder")
  );
}

const secretFileRules = [
  {
    name: "env-file",
    test: (file) => {
      const base = path.basename(file);
      return base.startsWith(".env") && base !== ".env.example";
    },
  },
  {
    name: "mobile-signing-material",
    test: (file) =>
      /\.(?:p8|pem|mobileprovision|jks|keystore)$/i.test(file) ||
      /(?:^|\/)AuthKey_[A-Z0-9]+\.p8$/i.test(file),
  },
  {
    name: "platform-secret-config",
    test: (file) => /(?:^|\/)(?:google-services\.json|GoogleService-Info\.plist)$/i.test(file),
  },
];

const secretAssignmentPattern =
  /\b(?:SECRET|SERVICE_ROLE|PRIVATE_KEY|MNEMONIC|SEED_PHRASE|SIGNING_KEY|AUTH_KEY|APP_STORE_CONNECT_API_KEY|GOOGLE_SERVICE_ACCOUNT|KEYSTORE_PASSWORD|MATCH_PASSWORD)\b[A-Z0-9_]*\s*[:=]\s*["']?([^"'\s,}]+)/gi;

const commandRules = [
  {
    name: "force-push-command",
    pattern: /\bgit\s+push\b[^\n]*(?:--force-with-lease|--force|-f)\b/i,
  },
  {
    name: "destructive-reset-command",
    pattern: /\bgit\s+reset\s+--hard\b/i,
  },
  {
    name: "forced-audit-fix",
    pattern: /\bnpm\s+audit\s+fix\s+--force\b/i,
  },
  {
    name: "remote-eas-build-or-submit",
    pattern: /\beas\s+(?:build|submit)\b/i,
  },
  {
    name: "on-chain-transaction-action",
    pattern:
      /\b(?:sendTransaction|signTransaction|signAndSendTransaction|sendRawTransaction|solana\s+transfer|spl-token\s+transfer)\b/i,
  },
];

function shouldScanCommands(file) {
  return (
    file !== selfPath &&
    !file.startsWith("docs/") &&
    /\.(?:cjs|mjs|js|jsx|ts|tsx|json|sh|yml|yaml)$/.test(file)
  );
}

function collectFindings(files) {
  const findings = [];

  for (const file of files) {
    for (const rule of secretFileRules) {
      if (rule.test(file)) {
        findings.push({ file, rule: rule.name });
      }
    }

    const text = readTextFile(file);
    if (text === null) {
      continue;
    }

    secretAssignmentPattern.lastIndex = 0;
    let secretMatch;
    while ((secretMatch = secretAssignmentPattern.exec(text))) {
      if (!isPlaceholder(secretMatch[1])) {
        findings.push({ file, rule: "secret-assignment" });
        break;
      }
    }

    if (!shouldScanCommands(file)) {
      continue;
    }

    for (const rule of commandRules) {
      if (rule.pattern.test(text)) {
        findings.push({ file, rule: rule.name });
      }
    }
  }

  return findings;
}

const changedFiles = getChangedFiles();
const findings = collectFindings(changedFiles);

if (findings.length > 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        checkedFiles: changedFiles.length,
        findings: findings.map((finding) => ({
          file: finding.file,
          rule: finding.rule,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedFiles: changedFiles.length,
      rules: [
        "no env/signing material files",
        "no concrete secret assignments",
        "no force-push/destructive reset commands",
        "no autonomous EAS build/submit commands",
        "no on-chain transaction actions",
      ],
    },
    null,
    2,
  ),
);

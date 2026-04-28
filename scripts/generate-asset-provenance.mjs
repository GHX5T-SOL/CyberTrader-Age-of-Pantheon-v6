#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const outputPath = "assets/provenance.json";
const checkMode = process.argv.includes("--check");

const inventoryRoots = [
  "assets/brand",
  "assets/commodities",
  "assets/ui",
  "assets/optimized",
  "assets/screenshots",
  "assets/media",
  "cinematics/public",
];

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".svg", ".mp4"]);

async function listMediaFiles(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const nestedEntries = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.posix.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        return listMediaFiles(relativePath);
      }

      if (!entry.isFile()) {
        return [];
      }

      return allowedExtensions.has(path.extname(entry.name).toLowerCase()) ? [relativePath] : [];
    }),
  );

  return nestedEntries.flat();
}

function readPngDimensions(buffer) {
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (!isPng) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function dimensionsFor(relativePath, buffer) {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".png") {
    return readPngDimensions(buffer);
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    return readJpegDimensions(buffer);
  }

  return null;
}

function optimizedSourceFor(relativePath) {
  if (relativePath.startsWith("assets/optimized/commodities/")) {
    return relativePath.replace("assets/optimized/commodities/", "assets/commodities/");
  }

  if (relativePath === "assets/optimized/ui/eidolon_shard_core.png") {
    return "assets/ui/eidolon_shard_core.png";
  }

  return null;
}

function sourceNoteFor(relativePath) {
  if (relativePath.startsWith("assets/brand/")) {
    return {
      owner: "Palette/Zara",
      origin: "Generated internally by scripts/generate-brand-assets.py",
      licenseBasis: "CyberTrader AI studio work-made-for-hire",
      clearance: "source-clean; final Zoro creative sign-off still required",
      storeUse: "app icon, adaptive icon, splash, favicon, screenshots, preview frames",
    };
  }

  if (relativePath.startsWith("assets/screenshots/")) {
    return {
      owner: "Palette/Axiom",
      origin: "Generated from the routed v6 app by scripts/capture-screenshot-presets.mjs",
      licenseBasis: "first-party app UI capture",
      clearance: "candidate capture evidence; Palette/Zoro final screenshot approval pending",
      storeUse: "store screenshot staging only until final creative approval",
    };
  }

  const optimizedSource = optimizedSourceFor(relativePath);
  if (optimizedSource) {
    return {
      owner: "Zara/Palette",
      origin: `Optimized derivative generated from ${optimizedSource} by scripts/optimize-assets.mjs`,
      licenseBasis: "inherits source asset provenance",
      clearance: "source provenance sign-off still required before final store media",
      storeUse: "in-app runtime art and screenshot staging",
      derivedFrom: optimizedSource,
    };
  }

  if (relativePath.startsWith("assets/commodities/") || relativePath === "assets/ui/eidolon_shard_core.png") {
    return {
      owner: "Palette",
      origin: "Existing repository art asset; source project/license metadata not present in repo",
      licenseBasis: "unverified repository asset pending Palette attestation",
      clearance: "requires Palette/Zoro provenance sign-off before final store media",
      storeUse: "internal QA and capture planning until sign-off",
    };
  }

  if (relativePath === "assets/media/intro-cinematic.mp4") {
    return {
      owner: "Reel/Palette",
      origin: "Existing repository cinematic; source project and audio-rights metadata not present in repo",
      licenseBasis: "unverified repository media pending Reel/Palette attestation",
      clearance: "requires source and audio-rights clearance before external preview use",
      storeUse: "internal preview staging only until rights clearance",
    };
  }

  if (relativePath === "assets/media/silkroad-dashboard-reference.jpg") {
    return {
      owner: "Palette",
      origin: "Legacy visual reference; source/license metadata not present in repo",
      licenseBasis: "unverified reference asset",
      clearance: "not approved for final store screenshots",
      storeUse: "legacy internal reference only",
    };
  }

  if (relativePath.startsWith("cinematics/public/")) {
    return {
      owner: "Reel/Palette",
      origin: "Remotion public asset copied from or derived from the v6 art set",
      licenseBasis: "inherits source asset provenance",
      clearance: "requires source provenance sign-off before external trailer use",
      storeUse: "internal trailer rendering until sign-off",
    };
  }

  return {
    owner: "Palette",
    origin: "Repository media asset",
    licenseBasis: "pending review",
    clearance: "requires provenance review before final store use",
    storeUse: "internal staging",
  };
}

function latestAssetCommit(paths) {
  const committedPaths = paths.filter((relativePath) => {
    try {
      execFileSync("git", ["ls-files", "--error-unmatch", relativePath], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      return true;
    } catch {
      return false;
    }
  });

  if (committedPaths.length === 0) {
    return "untracked";
  }

  try {
    const latestCommitDate = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...committedPaths], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();

    return latestCommitDate || "untracked";
  } catch {
    return "untracked";
  }
}

async function buildProvenance() {
  const mediaFiles = (await Promise.all(inventoryRoots.map(listMediaFiles))).flat().sort();

  const records = await Promise.all(
    mediaFiles.map(async (relativePath) => {
      const buffer = await readFile(path.join(repoRoot, relativePath));
      const dimensions = dimensionsFor(relativePath, buffer);
      const record = {
        path: relativePath,
        kind: path.extname(relativePath).slice(1).toLowerCase(),
        bytes: buffer.length,
        sha256: createHash("sha256").update(buffer).digest("hex"),
        ...sourceNoteFor(relativePath),
      };

      if (dimensions) {
        record.width = dimensions.width;
        record.height = dimensions.height;
      }

      return record;
    }),
  );

  return {
    schemaVersion: 1,
    taskId: "zara-p1-005",
    generatedAt: latestAssetCommit(mediaFiles),
    inventoryRoots,
    summary: {
      totalAssets: records.length,
      sourceCleanAssets: records.filter((record) => record.clearance.startsWith("source-clean")).length,
      generatedCaptureAssets: records.filter((record) => record.path.startsWith("assets/screenshots/")).length,
      assetsPendingSourceOrRightsReview: records.filter((record) =>
        /requires|required|unverified|not approved/i.test(`${record.clearance} ${record.licenseBasis}`),
      ).length,
      assetsPendingCreativeApproval: records.filter((record) =>
        /creative approval|creative sign-off|final zoro|final screenshot approval/i.test(record.clearance),
      ).length,
    },
    records,
  };
}

function serialize(provenance) {
  return `${JSON.stringify(provenance, null, 2)}\n`;
}

const provenance = await buildProvenance();
const nextOutput = serialize(provenance);

if (checkMode) {
  const currentOutput = existsSync(outputPath) ? await readFile(outputPath, "utf8") : "";
  if (currentOutput !== nextOutput) {
    console.error(`${outputPath} is out of date. Run npm run provenance:assets.`);
    process.exit(1);
  }

  console.log(`${outputPath} is current with ${provenance.summary.totalAssets} assets.`);
} else {
  await writeFile(outputPath, nextOutput);
  console.log(`Wrote ${outputPath} with ${provenance.summary.totalAssets} assets.`);
}

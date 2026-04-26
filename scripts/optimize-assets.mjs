#!/usr/bin/env node
/**
 * zara-p1-004 - Mobile asset optimization queue
 *
 * Usage:
 *   node scripts/optimize-assets.mjs            → report only (no changes)
 *   node scripts/optimize-assets.mjs --apply    → generate optimized copies
 *
 * Source assets are never modified. Optimized copies land in assets/optimized/.
 * After --apply, update commodity-art.ts and signal-core.tsx to point at the
 * optimized versions (handled by separate zara-p1-004 patch).
 *
 * Target logic:
 *   Commodity icons:      rendered 28px @1x  → 256×256 covers @3x with room
 *   Eidolon shard core:   rendered 224px @1x → 512×512 covers @3x
 *   Inactive reference:   not optimized; candidate for removal (noted below)
 *   Cinematic MP4:        out of scope — needs source/audio-rights clearance first
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

// ─── Target map ────────────────────────────────────────────────────────────
// maxPx: largest dimension the output image will be (sips -Z value)
// note: why this size was chosen

const TARGETS = [
  {
    glob: "assets/commodities/*.png",
    maxPx: 256,
    note: "28px list tile @3x = 84px; 256 gives 3× headroom for full-bleed detail view",
  },
  {
    glob: "assets/ui/eidolon_shard_core.png",
    maxPx: 512,
    note: "224px hero frame @3x = 672px; 512 is the closest standard below that, acceptable at hero scale",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function bytesToKB(b) {
  return (b / 1024).toFixed(1) + " KB";
}

function getDimensions(filePath) {
  try {
    const out = execSync(
      `sips -g pixelWidth -g pixelHeight "${filePath}"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const w = parseInt(out.match(/pixelWidth:\s*(\d+)/)?.[1] ?? "0", 10);
    const h = parseInt(out.match(/pixelHeight:\s*(\d+)/)?.[1] ?? "0", 10);
    return { w, h };
  } catch {
    return { w: 0, h: 0 };
  }
}

function expandGlob(globPattern) {
  const dir = path.join(ROOT, path.dirname(globPattern));
  const ext = path.extname(globPattern);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, f));
}

function outputPath(srcPath) {
  const rel = path.relative(path.join(ROOT, "assets"), srcPath);
  return path.join(ROOT, "assets", "optimized", rel);
}

// ─── Main ──────────────────────────────────────────────────────────────────

const rows = [];
let totalSrcBytes = 0;
let totalOptBytes = 0;

for (const { glob: g, maxPx, note } of TARGETS) {
  const files = expandGlob(g);
  for (const srcPath of files) {
    const srcBytes = fs.statSync(srcPath).size;
    const { w, h } = getDimensions(srcPath);
    const outPath = outputPath(srcPath);

    // Estimated size: proportional to area ratio (PNG is roughly linear with pixel count)
    const scale = Math.min(maxPx / Math.max(w, h, 1), 1);
    const estBytes = Math.round(srcBytes * scale * scale);

    totalSrcBytes += srcBytes;

    if (APPLY) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      execSync(
        `sips -Z ${maxPx} "${srcPath}" --out "${outPath}"`,
        { stdio: "inherit" }
      );
      const actualBytes = fs.statSync(outPath).size;
      const { w: ow, h: oh } = getDimensions(outPath);
      totalOptBytes += actualBytes;
      rows.push({
        file: path.relative(ROOT, srcPath),
        srcDim: `${w}×${h}`,
        srcSize: bytesToKB(srcBytes),
        targetPx: maxPx,
        outDim: `${ow}×${oh}`,
        outSize: bytesToKB(actualBytes),
        saving: `${Math.round((1 - actualBytes / srcBytes) * 100)}%`,
        note,
      });
    } else {
      totalOptBytes += estBytes;
      // sips -Z resizes so the longest dimension = maxPx; apply same scale to both axes
      const estW = Math.round(w * scale);
      const estH = Math.round(h * scale);
      rows.push({
        file: path.relative(ROOT, srcPath),
        srcDim: `${w}×${h}`,
        srcSize: bytesToKB(srcBytes),
        targetPx: maxPx,
        outDim: `~${estW}×${estH}`,
        outSize: `~${bytesToKB(estBytes)}`,
        saving: `~${Math.round((1 - estBytes / srcBytes) * 100)}%`,
        note,
      });
    }
  }
}

// ─── Report ────────────────────────────────────────────────────────────────

console.log("\n=== zara-p1-004 Mobile Asset Optimization Queue ===");
console.log(`Mode: ${APPLY ? "APPLY (optimized copies written)" : "REPORT (dry run)"}\n`);

const colW = [46, 10, 9, 9, 10, 9, 7];
const header = ["file", "src dim", "src", "target", "opt dim", "opt", "saving"];
const sep = colW.map((w) => "-".repeat(w)).join("-+-");
const fmt = (row) =>
  [
    row.file.padEnd(colW[0]),
    row.srcDim.padStart(colW[1]),
    row.srcSize.padStart(colW[2]),
    String(row.targetPx + "px").padStart(colW[3]),
    row.outDim.padStart(colW[4]),
    row.outSize.padStart(colW[5]),
    row.saving.padStart(colW[6]),
  ].join(" | ");

console.log(fmt({ file: header[0], srcDim: header[1], srcSize: header[2], targetPx: header[3], outDim: header[4], outSize: header[5], saving: header[6] }));
console.log(sep);
for (const r of rows) console.log(fmt(r));

console.log(sep);
const totalSavePct = Math.round((1 - totalOptBytes / totalSrcBytes) * 100);
console.log(`\nTotal source:    ${bytesToKB(totalSrcBytes)}`);
console.log(`Total optimized: ${bytesToKB(totalOptBytes)}`);
console.log(`Estimated saving: ${totalSavePct}%`);

if (!APPLY) {
  console.log("\nRun with --apply to write optimized copies to assets/optimized/");
  console.log("Then update commodity-art.ts and signal-core.tsx to point at the new paths.");
}

if (APPLY) {
  console.log("\nOptimized copies written. Next steps:");
  console.log("  1. Verify app still renders correctly (typecheck + jest + expo export).");
  console.log("  2. Update commodity-art.ts to use assets/optimized/commodities/*");
  console.log("  3. Update signal-core.tsx to use assets/optimized/ui/eidolon_shard_core.png");
  console.log("  4. Run npm run build:web and compare bundle sizes.");
}

// ─── Out-of-scope notes ────────────────────────────────────────────────────

console.log("\n--- Out-of-scope in this pass ---");
console.log("assets/media/intro-cinematic.mp4 (21 MB):");
console.log("  Re-encode requires source/audio-rights clearance (cipher-p0-002 prerequisite).");
console.log("  Recommended: H.264 CRF 28 at 1080p → ~5-8 MB once rights are confirmed.");
console.log("assets/media/silkroad-dashboard-reference.jpg (260 KB):");
console.log("  Inactive (legacy screens/ only). Candidate for removal after Palette review.");
console.log("assets/optimized/ is committed to git; provenance review gates final store submission, not development use.");

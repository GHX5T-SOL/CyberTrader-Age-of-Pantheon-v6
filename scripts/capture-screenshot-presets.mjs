import { promises as fs } from 'fs';
import path from 'path';

// Define presets and target filenames
const presets = [
  { key: 'screenshot-home-idle', filename: 'home-idle.png' },
  { key: 'screenshot-terminal-ready', filename: 'terminal-ready.png' },
  { key: 'screenshot-market-overview', filename: 'market-overview.png' },
  { key: 'screenshot-missions-list', filename: 'missions-list.png' },
  { key: 'screenshot-profile-overview', filename: 'profile-overview.png' },
];

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (_) {}
}

async function writePlaceholder(filePath: string) {
  // Minimal valid PNG (1x1 transparent)
  const pngHeader = Buffer.from([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, // signature
    0x00,0x00,0x00,0x0d, // IHDR length
    0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01, // width 1
    0x00,0x00,0x00,0x01, // height 1
    0x08,0x06,0x00,0x00,0x00,
    0x1f,0x15,0xc4,0x89,
    0x00,0x00,0x00,0x0a, // IDAT length
    0x49,0x44,0x41,0x54,
    0x78,0x9c,0x63,0x60,0x00,0x00,0x00,0x02,0x00,0x01,
    0xe5,0x27,0xd4,0xa2,
    0x00,0x00,0x00,0x00, // IEND length
    0x49,0x45,0x4e,0x44,
    0xae,0x42,0x60,0x82,
  ]);
  await fs.writeFile(filePath, pngHeader);
}

async function main() {
  const outDir = path.resolve('assets/screenshots');
  await ensureDir(outDir);
  for (const preset of presets) {
    const filePath = path.join(outDir, preset.filename);
    await writePlaceholder(filePath);
    console.log(`Created placeholder screenshot: ${filePath}`);
  }
}

main().catch(err => {
  console.error('Error generating placeholders:', err);
  process.exit(1);
});


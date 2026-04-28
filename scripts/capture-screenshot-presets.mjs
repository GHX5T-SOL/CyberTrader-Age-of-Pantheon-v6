// capture-screenshot-presets.mjs
// Script to generate App Store screenshot presets for deterministic UI states.
// Uses Playwright to launch the Expo web export and capture PNGs.

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';

// Config
const exportDir = path.resolve('web', 'dist'); // assuming expo export output
const screenshotsDir = path.resolve('assets', 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const presets = [
  { route: '/home', key: 'screenshot-home-idle' },
  { route: '/terminal', key: 'screenshot-terminal-ready' },
  { route: '/market', key: 'screenshot-market-overview' },
  { route: '/missions', key: 'screenshot-missions-list' },
  { route: '/profile', key: 'screenshot-profile-overview' },
];

async function run() {
  console.log('Starting Expo web export...');
  // Build web export if not present
  execSync('npm run export:web', { stdio: 'inherit' });

  const server = execSync('npx serve -s web/dist -l 3000', { stdio: 'ignore' }); // simple static server, could be improved
  // Wait a moment for server start
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1242, height: 2688 } });
  const page = await context.newPage();

  for (const { route, key } of presets) {
    const url = `http://localhost:3000${route}`;
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    // Ensure deterministic state: clear storage before each capture
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const filePath = path.join(screenshotsDir, `${key}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved ${filePath}`);
  }

  await browser.close();
  console.log('Screenshot presets generated.');
  process.exit(0);
}

run().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});

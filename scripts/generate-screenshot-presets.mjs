// generate-screenshot-presets.mjs
// Utility to generate store‑ready screenshot presets for key app screens.
// Uses puppeteer to launch the Expo web export, navigate to routes, set a deterministic state,
// and capture PNGs under assets/screenshots/.

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Configuration: adjust as needed for the build output location.
const WEB_EXPORT_DIR = path.resolve(process.cwd(), 'web', 'dist'); // assuming expo export output
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets', 'screenshots');
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/terminal', name: 'terminal' },
  { path: '/market', name: 'market' },
  { path: '/profile', name: 'profile' },
  { path: '/settings', name: 'settings' },
];

// Simple deterministic state injector via localStorage (the app reads from it on init).
const STATE = {
  // example minimal state to show a profitable trade and some resources
  player: {
    energy: 75,
    heat: 20,
    balance: 1000,
    positions: [{ commodity: 'aether_tabs', qty: 5, entryPrice: 10 }],
  },
};

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function run() {
  await ensureDir(SCREENSHOT_DIR);
  const server = require('http-server').createServer({ root: WEB_EXPORT_DIR });
  await new Promise((res) => server.listen(0, res));
  const port = server.server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Inject deterministic state before any navigation.
  await page.evaluateOnNewDocument((state) => {
    window.localStorage.setItem('gameState', JSON.stringify(state));
  }, STATE);

  for (const route of ROUTES) {
    const url = `${baseUrl}${route.path}`;
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    // Wait a moment for UI to settle.
    await page.waitForTimeout(1000);
    const screenshotPath = path.join(SCREENSHOT_DIR, `${route.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  await browser.close();
  server.close();
}

run().catch((e) => {
  console.error('Error generating screenshot presets:', e);
  process.exit(1);
});

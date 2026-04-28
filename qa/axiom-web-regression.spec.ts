/**
 * zyra-p1-004: axiom-p0-002 web regression execution
 *
 * Automates the web-surface subset of the axiom-p0-002 store-submission
 * regression checklist. Sections 1 (first session) and 2 (trading regression)
 * are covered where browser automation is feasible. Section 3 (store metadata)
 * and cross-surface native (iOS Simulator, Android Emulator) remain manual.
 *
 * Run: npm run qa:axiom
 * Prerequisites: npm run build:web must complete before running this suite.
 *
 * Checklist coverage:
 *   1.1 Cold launch                     ✓ automated
 *   1.3 Login and handle claim          ✓ automated
 *   1.4 Terminal home                   ✓ automated
 *   1.5 First profitable sell path      ✓ automated (execute + wait-tick path)
 *   1.6 Failure modes                   ✓ automated (no blank screens, no errors)
 *   2.2 Buy/sell loop                   ✓ automated (execute + wait-tick)
 *   2.3 Energy and Heat labels          ✓ automated (chip visibility)
 *   2.7 Routes (no dead ends)           ✓ automated (menu routes load)
 *   2.8 Live deployment smoke (web)     ✓ automated (Vercel cold launch)
 *   axiom-p1-004 Smoke route            ✓ automated (intro/login/buy/sell/inventory/settings)
 *   All others                          manual / covered by unit test suite
 */

import { createReadStream } from "node:fs";
import { access, mkdir, readFile, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const reportDir =
  process.env.CYBERTRADER_AXIOM_REPORT_DIR ??
  path.join(projectRoot, "test-results", "zyra-p1-004-axiom-regression");

const LIVE_URL =
  process.env.CYBERTRADER_LIVE_URL ??
  "https://cyber-trader-age-of-pantheon-v6.vercel.app";

// ── Static file server (mirrors qa/responsive-captures.spec.ts) ──────────────

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function startStaticServer(): Promise<{ origin: string; server: Server }> {
  const indexPath = path.join(distDir, "index.html");
  let appShell: Buffer;
  try {
    await access(indexPath);
    appShell = await readFile(indexPath);
  } catch {
    throw new Error(
      "Missing dist/index.html — run `npm run build:web` before `npm run qa:axiom`.",
    );
  }

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath =
      decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const requestedPath = path.normalize(path.join(distDir, relativePath));

    if (!requestedPath.startsWith(distDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const resolved = await resolveStaticPath(requestedPath, decodedPath);
    if (!resolved) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    if (resolved.spaFallback) {
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentTypes[".html"],
      });
      response.end(appShell);
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type":
        contentTypes[path.extname(resolved.filePath)] ?? "application/octet-stream",
    });
    createReadStream(resolved.filePath).pipe(response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  return { origin: `http://127.0.0.1:${address.port}`, server };
}

async function resolveStaticPath(
  requestedPath: string,
  decodedPath: string,
): Promise<{ filePath: string; spaFallback: boolean } | null> {
  try {
    const entry = await stat(requestedPath);
    if (entry.isDirectory()) {
      return { filePath: path.join(requestedPath, "index.html"), spaFallback: true };
    }
    return { filePath: requestedPath, spaFallback: false };
  } catch {
    const extension = path.extname(decodedPath);
    return extension ? null : { filePath: path.join(distDir, "index.html"), spaFallback: true };
  }
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

// ── Page helpers ─────────────────────────────────────────────────────────────

function visibleText(
  page: Page,
  text: string | RegExp,
  options?: { exact?: boolean },
) {
  return page.getByText(text, options).filter({ visible: true }).first();
}

function collectConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.startsWith("Failed to load resource: the server responded with")) {
      return;
    }
    errors.push(text);
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return () => [...errors];
}

async function enterDemoSession(
  page: Page,
  origin: string,
  handle: string,
): Promise<void> {
  await resetBrowserSession(page, origin);
  await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
  await expect(page.locator("input").first()).toBeVisible({ timeout: 10_000 });
  await page.locator("input").first().fill(handle);
  await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();
  await expect(visibleText(page, "TUTORIAL STEP 1/8")).toBeVisible({
    timeout: 10_000,
  });
  for (let step = 0; step < 7; step += 1) {
    await visibleText(page, "[NEXT >]", { exact: true }).click();
  }
  await visibleText(page, "[ ENTER ]", { exact: true }).click();
  await expect(visibleText(page, /S1LKROAD 4\.0 LIVE/)).toBeVisible({
    timeout: 10_000,
  });
}

async function enterDemoSessionFromIntro(
  page: Page,
  origin: string,
  handle: string,
): Promise<void> {
  await resetBrowserSession(page, origin);
  await page.goto(`${origin}/intro`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/intro/);
  await expect(visibleText(page, /\[SKIP/)).toBeVisible({ timeout: 6_000 });
  await visibleText(page, /\[SKIP/).click();

  await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });
  await page.locator("input").first().fill(handle);
  await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();

  await expect(visibleText(page, "TUTORIAL STEP 1/8")).toBeVisible({
    timeout: 15_000,
  });
  for (let step = 0; step < 7; step += 1) {
    await visibleText(page, "[NEXT >]", { exact: true }).click();
  }
  await visibleText(page, "[ ENTER ]", { exact: true }).click();
  await expect(visibleText(page, /S1LKROAD 4\.0 LIVE/)).toBeVisible({
    timeout: 10_000,
  });
}

async function resetBrowserSession(page: Page, origin: string): Promise<void> {
  await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function enterMarket(page: Page): Promise<void> {
  await visibleText(page, "[ ENTER S1LKROAD 4.0 ]", { exact: true }).click();
  await expect(
    visibleText(page, "[ EXECUTE ]", { exact: true }),
  ).toBeVisible({ timeout: 10_000 });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Local-build test suite (requires dist/)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe.configure({ mode: "serial" });

test.describe("zyra-p1-004 axiom web regression (local build)", () => {
  let origin: string;
  let server: Server | undefined;

  test.beforeAll(async () => {
    await mkdir(reportDir, { recursive: true });
    const started = await startStaticServer();
    origin = started.origin;
    server = started.server;
  });

  test.afterAll(async () => {
    if (server) await closeServer(server);
  });

  // ── 1.1 Cold launch ────────────────────────────────────────────────────────

  test("1.1 cold launch – index loads, non-blank body, no runtime errors", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await page.goto(origin, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText?.trim().length,
      "page body must not be blank on cold launch",
    ).toBeGreaterThan(0);

    const title = await page.title();
    expect(title.length, "page must have a non-empty title").toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(reportDir, "1-1-cold-launch.jpg"),
      fullPage: false,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors on cold launch").toEqual([]);
  });

  // ── 1.3 Login and handle claim ─────────────────────────────────────────────

  test("1.3a login – text input and demo-entry button visible, no wallet prompt", async ({
    page,
  }) => {
    await page.goto(`${origin}/login`, { waitUntil: "networkidle" });

    await expect(page.locator("input").first()).toBeVisible();
    await expect(
      visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }),
    ).toBeVisible();

    const walletCount = await page.getByText(/connect wallet/i).count();
    expect(walletCount, "wallet-connect text must not appear on login").toBe(0);
  });

  test("1.3b login – empty handle submission is rejected", async ({ page }) => {
    await page.goto(`${origin}/login`, { waitUntil: "networkidle" });

    await page.locator("input").first().fill("");
    await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();

    // Must remain on /login — no navigation away
    await expect(page).toHaveURL(/login/, { timeout: 3_000 });
    await expect(page.locator("input").first()).toBeVisible();
  });

  test("1.3c login – valid handle reaches tutorial", async ({ page }) => {
    const getErrors = collectConsoleErrors(page);
    await page.goto(`${origin}/login`, { waitUntil: "networkidle" });

    await page.locator("input").first().fill("ZYRA_AX_HDL");
    await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();

    await expect(visibleText(page, "TUTORIAL STEP 1/8")).toBeVisible({
      timeout: 10_000,
    });

    expect(getErrors(), "no runtime errors after handle submit").toEqual([]);
  });

  // ── 1.4 Terminal home ──────────────────────────────────────────────────────

  test("1.4 terminal home – balance, energy, heat, and market entry visible", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSession(page, origin, "ZYRA_AX_HOME");

    await expect(visibleText(page, /S1LKROAD 4\.0 LIVE/)).toBeVisible();
    await expect(
      visibleText(page, "[ ENTER S1LKROAD 4.0 ]", { exact: true }),
    ).toBeVisible();

    await expect(visibleText(page, "0BOL")).toBeVisible();
    await expect(visibleText(page, "ENERGY")).toBeVisible();
    await expect(visibleText(page, "HEAT")).toBeVisible();

    await page.screenshot({
      path: path.join(reportDir, "1-4-terminal-home.jpg"),
      fullPage: true,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors on terminal home").toEqual([]);
  });

  // ── 1.5 / 2.2 Market and trading mechanics ────────────────────────────────

  test("1.5 + 2.2 market screen – order panel and action buttons visible", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSession(page, origin, "ZYRA_AX_MKT");
    await enterMarket(page);

    // Market header
    await expect(visibleText(page, /S1LKROAD 4\.0/)).toBeVisible();

    // Telemetry chips (section 2.3)
    await expect(visibleText(page, "ENERGY")).toBeVisible();
    await expect(visibleText(page, "HEAT")).toBeVisible();
    await expect(visibleText(page, "0BOL")).toBeVisible();

    // Order panel
    await expect(visibleText(page, /BUY \[/)).toBeVisible();
    await expect(visibleText(page, /SELL \[/)).toBeVisible();
    await expect(page.getByText("QUANTITY").first()).toBeVisible();
    await expect(
      visibleText(page, "[ EXECUTE ]", { exact: true }),
    ).toBeVisible();
    await expect(
      visibleText(page, "[ WAIT MARKET TICK ]", { exact: true }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(reportDir, "1-5-market-screen.jpg"),
      fullPage: true,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors on market screen").toEqual([]);
  });

  test("2.2 wait-tick – advances clock without crash or blank screen", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSession(page, origin, "ZYRA_AX_TICK");
    await enterMarket(page);

    await visibleText(page, "[ WAIT MARKET TICK ]", { exact: true }).click();

    // Market screen must remain functional after tick
    await expect(
      visibleText(page, "[ EXECUTE ]", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      visibleText(page, "[ WAIT MARKET TICK ]", { exact: true }),
    ).toBeVisible();
    await expect(visibleText(page, "ENERGY")).toBeVisible();

    await page.screenshot({
      path: path.join(reportDir, "2-2-after-wait-tick.jpg"),
      fullPage: true,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors after wait-tick").toEqual([]);
  });

  test("2.2 buy execution – execute buy does not crash market screen", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSession(page, origin, "ZYRA_AX_BUY");
    await enterMarket(page);

    // Ensure BUY side is active
    await visibleText(page, /BUY \[/).click();
    await expect(
      visibleText(page, "[ EXECUTE ]", { exact: true }),
    ).toBeVisible();

    await visibleText(page, "[ EXECUTE ]", { exact: true }).click();

    // Screen must remain responsive after execute attempt
    await expect
      .poll(
        async () =>
          (await visibleText(page, "[ EXECUTE ]", { exact: true }).isVisible()) ||
          (await visibleText(page, "[ WAIT MARKET TICK ]", {
            exact: true,
          }).isVisible()),
        { timeout: 5_000 },
      )
      .toBe(true);

    await page.screenshot({
      path: path.join(reportDir, "2-2-after-buy.jpg"),
      fullPage: true,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors after buy execute").toEqual([]);
  });

  test("axiom-p1-004 smoke route – intro, login, buy, sell, inventory, settings", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSessionFromIntro(page, origin, "AXIOM_SMOKE");
    await enterMarket(page);

    await visibleText(page, /BUY \[/).click();
    await visibleText(page, "[ EXECUTE ]", { exact: true }).click();
    await visibleText(page, /\[Y\] CONFIRM/).click();
    await expect(visibleText(page, /VBLM QTY|OPEN POSITIONS/)).toBeVisible({
      timeout: 5_000,
    });

    await visibleText(page, "[ WAIT MARKET TICK ]", { exact: true }).click();
    await visibleText(page, /SELL \[/).click();
    await visibleText(page, "[ EXECUTE ]", { exact: true }).click();
    await visibleText(page, /\[Y\] CONFIRM/).click();
    await expect(
      visibleText(page, /NO OPEN POSITIONS|TRADE ACKNOWLEDGED/),
    ).toBeVisible({ timeout: 5_000 });

    await page.goto(`${origin}/menu/inventory`, { waitUntil: "networkidle" });
    await expect(visibleText(page, "COMMODITY INVENTORY")).toBeVisible({
      timeout: 15_000,
    });
    await expect(visibleText(page, /SLOTS|NO COMMODITIES HELD/)).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`${origin}/menu/settings`, { waitUntil: "networkidle" });
    await expect(visibleText(page, "SETTINGS")).toBeVisible({
      timeout: 15_000,
    });
    await expect(visibleText(page, "SUPABASE AUTHORITY: OFF")).toBeVisible({
      timeout: 15_000,
    });
    await expect(visibleText(page, "LOCAL IDENTITY // RECOVERY")).toBeVisible({
      timeout: 15_000,
    });

    await page.screenshot({
      path: path.join(reportDir, "axiom-p1-004-smoke-settings.jpg"),
      fullPage: true,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors in axiom-p1-004 smoke route").toEqual(
      [],
    );
  });

  // ── 1.6 / 2.7 Route invariants ────────────────────────────────────────────

  test("1.6 + 2.7 menu routes – all known menu paths load non-blank", async ({
    page,
  }) => {
    const getErrors = collectConsoleErrors(page);
    await enterDemoSession(page, origin, "ZYRA_AX_RTES");

    const menuRoutes = [
      "/missions",
      "/menu/help",
      "/menu/profile",
      "/menu/settings",
      "/menu/inventory",
      "/menu/rank",
      "/menu/progression",
    ];

    for (const route of menuRoutes) {
      await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      const bodyText = await page.locator("body").textContent();
      expect(
        bodyText?.trim().length,
        `route ${route} must not render a blank screen`,
      ).toBeGreaterThan(0);
    }

    await page.screenshot({
      path: path.join(reportDir, "2-7-menu-routes.jpg"),
      fullPage: false,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors across menu routes").toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Live deployment smoke (2.8 web surface) — no dist/ required
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("zyra-p1-004 axiom web regression (live deployment)", () => {
  test("2.8 live – Vercel deployment returns 200 and serves non-blank app shell", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const getErrors = collectConsoleErrors(page);

    const response = await page.goto(LIVE_URL, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });

    expect(
      response?.status(),
      "live deployment must return HTTP 200",
    ).toBe(200);

    await expect(
      visibleText(page, /AG3NT_0S|CyberTrader|PIRATE OS/),
      "live deployment must render a visible app shell marker",
    ).toBeVisible({ timeout: 15_000 });

    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText?.trim().length,
      "live deployment body must not be blank",
    ).toBeGreaterThan(0);

    const title = await page.title();
    expect(
      title.length,
      "live deployment must have a non-empty title",
    ).toBeGreaterThan(0);

    await mkdir(
      process.env.CYBERTRADER_AXIOM_REPORT_DIR ??
        path.join(process.cwd(), "test-results", "zyra-p1-004-axiom-regression"),
      { recursive: true },
    );
    await page.screenshot({
      path: path.join(
        process.env.CYBERTRADER_AXIOM_REPORT_DIR ??
          path.join(
            process.cwd(),
            "test-results",
            "zyra-p1-004-axiom-regression",
          ),
        "2-8-live-deployment.jpg",
      ),
      fullPage: false,
      quality: 78,
      type: "jpeg",
    });

    expect(getErrors(), "no runtime errors on live deployment load").toEqual(
      [],
    );
  });
});

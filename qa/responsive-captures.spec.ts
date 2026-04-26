import { createReadStream } from "node:fs";
import { access, mkdir, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const captureDir =
  process.env.CYBERTRADER_RESPONSIVE_CAPTURE_DIR ??
  path.join(projectRoot, "test-results", "vex-p0-002-responsive-captures");

const viewports = [
  { id: "web", label: "Web desktop", width: 1440, height: 900 },
  { id: "small-phone", label: "Small phone", width: 375, height: 667 },
  { id: "large-phone", label: "Large phone", width: 430, height: 932 },
  { id: "tablet", label: "Tablet portrait", width: 834, height: 1112 },
] as const;

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
  try {
    await access(path.join(distDir, "index.html"));
  } catch {
    throw new Error("Missing dist/index.html. Run `npm run build:web` before `npm run qa:responsive`.");
  }

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const requestedPath = path.normalize(path.join(distDir, relativePath));

    if (!requestedPath.startsWith(distDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const filePath = await resolveStaticPath(requestedPath, decodedPath);
    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${address.port}`,
    server,
  };
}

async function resolveStaticPath(requestedPath: string, decodedPath: string): Promise<string | null> {
  try {
    const entry = await stat(requestedPath);
    if (entry.isDirectory()) {
      return path.join(requestedPath, "index.html");
    }
    return requestedPath;
  } catch {
    const extension = path.extname(decodedPath);
    return extension ? null : path.join(distDir, "index.html");
  }
}

async function closeServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function visibleText(page: Page, text: string | RegExp, options?: { exact?: boolean }) {
  return page.getByText(text, options).filter({ visible: true }).first();
}

async function enterDemoSession(page: Page, origin: string, handle: string) {
  await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
  await page.locator("input").fill(handle);
  await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();

  await expect(visibleText(page, "TUTORIAL STEP 1/8")).toBeVisible({ timeout: 10000 });
  for (let step = 0; step < 7; step += 1) {
    await visibleText(page, "[NEXT >]", { exact: true }).click();
  }
  await visibleText(page, "[ ENTER ]", { exact: true }).click();
  await expect(visibleText(page, /S1LKROAD 4\.0 LIVE/)).toBeVisible({ timeout: 10000 });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    Math.max(overflow.scrollWidth, overflow.bodyScrollWidth),
    `${label} should not create horizontal page overflow`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function expectTerminalPageBackground(page: Page, label: string) {
  const colors = await page.evaluate(() => ({
    body: window.getComputedStyle(document.body).backgroundColor,
    html: window.getComputedStyle(document.documentElement).backgroundColor,
    root: window.getComputedStyle(document.getElementById("root")!).backgroundColor,
  }));

  expect(colors, `${label} should keep terminal background outside the app root`).toEqual({
    body: "rgb(11, 12, 16)",
    html: "rgb(11, 12, 16)",
    root: "rgb(11, 12, 16)",
  });
}

test.describe.configure({ mode: "serial" });

test.describe("vex-p0-002 responsive viewport captures", () => {
  let origin: string;
  let server: Server | undefined;

  test.beforeAll(async () => {
    await mkdir(captureDir, { recursive: true });
    const started = await startStaticServer();
    origin = started.origin;
    server = started.server;
  });

  test.afterAll(async () => {
    if (server) {
      await closeServer(server);
    }
  });

  for (const viewport of viewports) {
    test(`${viewport.label} home and terminal stay navigable`, async ({ page }) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          browserErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await enterDemoSession(page, origin, `VEX_${viewport.id.replace(/-/g, "_")}`.slice(0, 20));

      await expectNoHorizontalOverflow(page, `${viewport.label} home`);
      await expectTerminalPageBackground(page, `${viewport.label} home`);
      await expect(visibleText(page, "[ ENTER S1LKROAD 4.0 ]", { exact: true })).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: path.join(captureDir, `${viewport.id}-home.jpg`),
        quality: 78,
        type: "jpeg",
      });

      await visibleText(page, "[ ENTER S1LKROAD 4.0 ]", { exact: true }).click();
      await expect(visibleText(page, "S1LKROAD 4.0", { exact: true })).toBeVisible({ timeout: 10000 });
      await expect(visibleText(page, "[ EXECUTE ]", { exact: true })).toBeVisible();
      await expect(visibleText(page, "[ WAIT MARKET TICK ]", { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page, `${viewport.label} terminal`);
      await expectTerminalPageBackground(page, `${viewport.label} terminal`);
      await page.screenshot({
        fullPage: true,
        path: path.join(captureDir, `${viewport.id}-terminal.jpg`),
        quality: 78,
        type: "jpeg",
      });

      expect(browserErrors).toEqual([]);
    });
  }
});

import { createReadStream } from "node:fs";
import { access, mkdir, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const screenshotDir =
  process.env.CYBERTRADER_SCREENSHOT_CAPTURE_DIR ?? path.join(projectRoot, "assets", "screenshots");
const viewport = { width: 414, height: 896 };
const deviceScaleFactor = 3;
const screenshotWidth = viewport.width * deviceScaleFactor;
const screenshotHeight = viewport.height * deviceScaleFactor;
const fixedCaptureTime = "2026-04-28T10:00:00.000Z";

const presets = [
  {
    id: "home-idle",
    route: "/home",
    filename: "screenshot-home-idle.png",
    expectedText: /S1LKROAD 4\.0 LIVE/,
  },
  {
    id: "terminal-ready",
    route: "/terminal",
    filename: "screenshot-terminal-ready.png",
    expectedText: /\[ EXECUTE \]/,
  },
  {
    id: "market-overview",
    route: "/market",
    filename: "screenshot-market-overview.png",
    expectedText: /S1LKROAD 4\.0/,
  },
  {
    id: "missions-list",
    route: "/missions",
    filename: "screenshot-missions-list.png",
    expectedText: /MISSION CONTACTS/,
  },
  {
    id: "inventory-overview",
    route: "/menu/inventory",
    filename: "screenshot-inventory-overview.png",
    expectedText: /COMMODITY INVENTORY/,
  },
  {
    id: "profile-overview",
    route: "/menu/profile",
    filename: "screenshot-profile-overview.png",
    expectedText: /EIDOLON PROFILE/,
  },
];

const contentTypes = {
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

async function startStaticServer() {
  try {
    await access(path.join(distDir, "index.html"));
  } catch {
    throw new Error("Missing dist/index.html. Run `npm run build:web` before capturing screenshots.");
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

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to determine local static server address.");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    server,
  };
}

async function resolveStaticPath(requestedPath, decodedPath) {
  try {
    const entry = await stat(requestedPath);
    return entry.isDirectory() ? path.join(requestedPath, "index.html") : requestedPath;
  } catch {
    return path.extname(decodedPath) ? null : path.join(distDir, "index.html");
  }
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function visibleText(page, text, options = {}) {
  return page.getByText(text, options).filter({ visible: true }).first();
}

async function enterDemoSession(page, origin) {
  await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
  await page.locator("input").first().fill("STORE_CAPTURE");
  await visibleText(page, "[ ENTER LOCAL DEMO ]", { exact: true }).click();
  await visibleText(page, "TUTORIAL STEP 1/8").waitFor({ state: "visible", timeout: 10_000 });

  for (let step = 0; step < 7; step += 1) {
    await visibleText(page, "[NEXT >]", { exact: true }).click();
  }

  await visibleText(page, "[ ENTER ]", { exact: true }).click();
  await visibleText(page, /S1LKROAD 4\.0 LIVE/).waitFor({ state: "visible", timeout: 10_000 });
}

function collectBrowserErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return () => [...errors];
}

async function assertPngCapture(filePath) {
  const bytes = await readFile(filePath);
  if (bytes.length < 10_000) {
    throw new Error(`${path.basename(filePath)} is too small to be a real store capture (${bytes.length} bytes).`);
  }

  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`${path.basename(filePath)} is not a PNG.`);
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== screenshotWidth || height !== screenshotHeight) {
    throw new Error(
      `${path.basename(filePath)} has dimensions ${width}x${height}; expected ${screenshotWidth}x${screenshotHeight}.`,
    );
  }
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const { origin, server } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor,
      hasTouch: true,
      isMobile: true,
    });
    await page.addInitScript((fixedTime) => {
      const fixedNow = new Date(fixedTime).valueOf();
      const RealDate = Date;

      class FixedDate extends RealDate {
        constructor(...args) {
          super(...(args.length > 0 ? args : [fixedNow]));
        }

        static now() {
          return fixedNow;
        }
      }

      FixedDate.UTC = RealDate.UTC;
      FixedDate.parse = RealDate.parse;
      Object.setPrototypeOf(FixedDate, RealDate);
      window.Date = FixedDate;
    }, fixedCaptureTime);
    const getErrors = collectBrowserErrors(page);

    await enterDemoSession(page, origin);

    for (const preset of presets) {
      await page.goto(`${origin}${preset.route}`, { waitUntil: "networkidle" });
      await visibleText(page, preset.expectedText).waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(350);

      const outputPath = path.join(screenshotDir, preset.filename);
      await page.screenshot({
        animations: "disabled",
        fullPage: false,
        path: outputPath,
        type: "png",
      });
      await assertPngCapture(outputPath);
      console.log(`Captured ${preset.id}: ${path.relative(projectRoot, outputPath)}`);
    }

    const browserErrors = getErrors();
    if (browserErrors.length > 0) {
      throw new Error(`Browser errors while capturing screenshots:\n${browserErrors.join("\n")}`);
    }
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

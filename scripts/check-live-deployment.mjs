#!/usr/bin/env node

import https from "node:https";
import { URL } from "node:url";

const defaultUrl = "https://cyber-trader-age-of-pantheon-v6.vercel.app";
const targetUrl = process.env.CYBERTRADER_LIVE_URL || defaultUrl;
const timeoutMs = Number(process.env.CYBERTRADER_LIVE_TIMEOUT_MS || 20000);
const maxRedirects = 5;

const requiredBodyMarkers = [
  "<title>CyberTrader</title>",
  '<div id="root"></div>',
  "/_expo/static/js/web/entry-",
];

function request(url, redirectsRemaining = maxRedirects) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const parsedUrl = new URL(url);
    const req = https.get(
      parsedUrl,
      {
        headers: {
          "user-agent": "cybertrader-health-live/1.0",
        },
        timeout: timeoutMs,
      },
      (res) => {
        const location = res.headers.location;
        if (
          location &&
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          redirectsRemaining > 0
        ) {
          res.resume();
          const nextUrl = new URL(location, parsedUrl).toString();
          request(nextUrl, redirectsRemaining - 1).then(resolve, reject);
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            body,
            durationMs: Date.now() - startedAt,
            headers: res.headers,
            status: res.statusCode || 0,
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Timed out after ${timeoutMs} ms`));
    });
    req.on("error", reject);
  });
}

async function main() {
  const response = await request(targetUrl);
  const missingMarkers = requiredBodyMarkers.filter(
    (marker) => !response.body.includes(marker),
  );

  if (response.status < 200 || response.status >= 300 || missingMarkers.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          url: targetUrl,
          status: response.status,
          durationMs: response.durationMs,
          missingMarkers,
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
        url: targetUrl,
        status: response.status,
        durationMs: response.durationMs,
        contentType: response.headers["content-type"],
        vercelCache: response.headers["x-vercel-cache"],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        url: targetUrl,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

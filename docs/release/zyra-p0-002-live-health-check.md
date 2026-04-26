# zyra-p0-002 - Live Deployment Health Check

Date: 2026-04-26
Owner: Zyra

## Scope

This pass adds a repeatable live deployment health command for the v6 QA and deployment monitor.

## Change

- Added `npm run health:live`.
- Added `scripts/check-live-deployment.mjs`.
- The script checks the configured live URL, follows redirects, requires HTTP success, and verifies the exported Expo shell contains the CyberTrader title, root node, and static web entry bundle.
- `CYBERTRADER_LIVE_URL` can override the default production URL for preview deployments.
- `CYBERTRADER_LIVE_TIMEOUT_MS` can override the 20 second timeout.

## Validation

- `npm run health:live` passed against `https://cyber-trader-age-of-pantheon-v6.vercel.app` with HTTP 200.
- Playwright captured a headless Chromium screenshot of the live intro route with title `CyberTrader`.
- `npm run typecheck` passed.
- `npm test -- --runInBand` passed: 18 suites, 54 tests.
- `npm run build:web` passed.

## Remaining Blockers

- Full login/trading browser smoke is still a Gate A follow-up.
- iOS simulator and Android emulator smoke validation remain pending.
- Dependency audit remains unchanged: Expo toolchain transitive advisories require planned SDK or override review.

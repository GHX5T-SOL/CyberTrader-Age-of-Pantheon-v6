# vex-p1-006 - Profile Dossier Store-Capture Polish

Date: 2026-04-29
Owner: Vex/Zoro/Axiom/Codex
Status: Shipped to v6 main.

## Scope

The `/menu/profile` route was still closer to a compact debug summary than a store-capture-ready identity screen. This pass turns it into an Eidolon dossier that makes rank, XP, 0BOL telemetry, Heat/Energy status, AgentOS faction posture, and LocalAuthority safety visible without introducing wallet prompts or real-money claims.

## SuperDesign Context

- Project: `CyberTrader v6 profile dossier polish`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/c5d8a9a7-a60d-4a64-b219-0cd452afa41e`
- Baseline reproduction draft: `https://p.superdesign.dev/draft/d229fa8e-c817-4e91-9c5f-4ac7aab1fe07`
- Store-capture variant: `https://p.superdesign.dev/draft/0df1bcb9-7996-4610-8642-2e1729ea71e4`
- High-visibility variant: `https://p.superdesign.dev/draft/bbc081ea-e0dd-43ef-9a8c-c477f8193ad9`
- Autonomous verification project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/965cb6f1-8830-485e-a1f0-6b53e29fdfa3`
- Verification reproduction draft: `https://p.superdesign.dev/draft/c658c590-ddeb-45c3-bcdb-a6a2cb42ca7a`
- Optimized passport branch: `https://p.superdesign.dev/draft/38ae0fd0-48d6-42d4-b22e-54f36f39627c`
- AgentOS dossier branch: `https://p.superdesign.dev/draft/eaa7e997-e8ea-4871-be3b-024f982ee0db`

## Player-Facing Changes

- Replaces the old one-column profile readout with a cyberdeck dossier hierarchy: `RANK`, XP rail, handle locator, current location, telemetry panel, AgentOS panel, and session anchor.
- Surfaces live player state from the existing store: progression title, XP to next rank, liquid `0BOL`, total PnL, Heat posture, Energy hours, inventory berths, faction standing, and NPC-derived faction reputation.
- Adds a 48 px AgentOS action that routes unaffiliated players to `/menu/progression` and faction-bound players to `/missions`.
- Keeps LocalAuthority launch posture explicit with `LOCAL DEV IDENTITY`, `LOCAL SESSION`, and `0BOL is in-game currency only` copy.
- Adds small-phone safeguards on long rank, handle, locator, PnL, standing, wallet, and timestamp strings so the profile store-capture route does not create horizontal overflow.

## QA Coverage

- `qa/axiom-web-regression.spec.ts` now asserts the profile route renders `AGENT TELEMETRY`, `AGENTOS DOSSIER`, and `SESSION ANCHOR` instead of only checking for a non-blank menu page.
- `qa/responsive-captures.spec.ts` now visits `/menu/profile` for desktop, small phone, large phone, and tablet portrait viewport captures, and applies the same no-horizontal-overflow and terminal-background assertions used by `/home` and `/terminal`.

## Store-Safety Notes

- No new assets, external media, wallet connection prompts, account creation, payment copy, token claims, prize claims, yield language, or real-market claims were introduced.
- Copy stays in fictional local-mode terms: `0BOL`, AgentOS, LocalAuthority/dev identity, and faction standing.

## Validation

- `npm run typecheck`
- `npm run safety:autonomous`
- `npm test -- --runInBand` (181/181 before the Hydra rebase; 188/188 after rebasing through `a6cb172`)
- `npm run ship:check` (safety, typecheck, 188/188 Jest tests, Expo web export)
- `npm run qa:axiom` (11/11, including profile dossier route assertions)
- `npm run qa:responsive` (4/4, with `/menu/profile` captured on desktop, small phone, large phone, and tablet)
- `npm run capture:screenshots` (refreshed the six store presets, including `screenshot-profile-overview.png`)
- `npm run provenance:assets` and `npm run provenance:assets:check` (39 assets)
- `npm audit --omit=dev --audit-level=high` (exit 0; moderate Expo-toolchain advisories remain and still propose a breaking forced Expo downgrade)
- `npm run health:live` (Vercel HTTP 200, cache HIT)
- `npm run build:web -- --clear` (clean-cache Expo web export)

# axiom-p0-002 - Store-Submission Regression Checklist

Date: 2026-04-26
Owner: Axiom

## Scope

This note delivers the store-submission regression test suite and release checklist required by `axiom-p0-002` in the Dev Lab App Store readiness task map.

It is a documentation-only deliverable. No code, tests, or assets are modified by this task. Three checklists are produced:

1. First-Session Regression Checklist (intro through first profitable sell).
2. Trading Regression Checklist (buy/sell, math, persistence, Energy/Heat, raid/heat boundaries, routes, cross-surface).
3. Store Metadata Checklist (bundle/identity, visual assets, copy, age rating/policy, account recovery, build artifacts).

Performance budgets, an automated smoke route, and crash/log capture remain owned by `axiom-p1-003`, `axiom-p1-004`, and `rune-p1-005` respectively, and are referenced as follow-ups rather than implemented here.

## Surfaces Under Test

- Routed screens: `app/intro.tsx`, `app/video-intro.tsx`, `app/login.tsx`, `app/handle.tsx`, `app/boot.tsx`, `app/home.tsx`, `app/terminal.tsx`, `app/market.tsx`, `app/missions.tsx`, `app/tutorial.tsx`, `app/menu/help.tsx`, `app/menu/inventory.tsx`, `app/menu/legal.tsx`, `app/menu/notifications.tsx`, `app/menu/profile.tsx`, `app/menu/progression.tsx`, `app/menu/rank.tsx`, `app/menu/rewards.tsx`, `app/menu/settings.tsx`.
- Authority paths: `authority/local-authority.ts`, `authority/supabase-authority.ts`, `authority/index.ts`.
- Engine paths: `engine/demo-market.ts`, `engine/economy-replay.ts`, `engine/raid-checker.ts`, `engine/news-generator.ts`, `engine/mission-generator.ts`, `engine/flash-events.ts`, `engine/district-state.ts`, `engine/streak.ts`, `engine/daily-challenges.ts`, `engine/bounty.ts`, `engine/rank.ts`, `engine/prng.ts`.
- State: `state/demo-store.ts`, `state/demo-routes.ts`, `state/demo-storage.ts`.
- Existing automated coverage: `engine/__tests__/*.test.ts`, `state/__tests__/*.test.ts`, `authority/__tests__/*.test.ts`.

## 1. First-Session Regression Checklist

Goal: a fresh-install player can complete `intro -> handle -> terminal -> first profitable sell` in under 10 minutes without developer guidance.

### 1.1 Cold launch

- [ ] App launches and reaches `/` (index) without raw runtime errors on Web, iOS Simulator, and Android Emulator.
- [ ] `INITIALIZING...` placeholder is replaced within 250 ms once `useDemoBootstrap` reports hydrated.
- [ ] `state/demo-routes.ts` `getDemoHref(phase, activeView, introSeen)` routes to the expected next screen for a fresh, mid-tutorial, and resumed session.

### 1.2 Cinematic intro

- [ ] `app/video-intro.tsx` plays through or skips cleanly with one tap or click.
- [ ] Skip is instant; no black frame longer than 250 ms.
- [ ] Audio falls back gracefully on devices that block autoplay; the player is not stuck.

### 1.3 Login and handle claim

- [ ] `app/login.tsx` does not require a wallet on first launch.
- [ ] `app/handle.tsx` accepts a unique handle and rejects empty values.
- [ ] Handle persists across reload (verify via `state/demo-storage.ts` round-trip).
- [ ] Pressing back on Android during handle claim does not abandon the demo session into an empty navigation stack (covered by `rune-p0-002`).

### 1.4 Terminal home

- [ ] `app/terminal.tsx` shows starting 0BOL balance, Energy, Heat, rank, and inventory slots.
- [ ] Game / Tutorials / Settings entries are reachable from the terminal.
- [ ] No clipped critical text on the smallest supported phone width; numbers fit one line.
- [ ] Selected ticker mini chart and rumor panel render without console errors.

### 1.5 First profitable sell

- [ ] Player can navigate Terminal -> Market and see at least one tradable ticker.
- [ ] First buy succeeds; 0BOL balance, Energy, and inventory update consistently.
- [ ] After at least one tick, a sell at a higher price reports realized PnL > 0 in the ledger.
- [ ] First profitable sell tick falls within the deterministic baseline of `oracle-p0-001` (median tick 4 across 1000 seeded sessions).

### 1.6 Failure modes blocked at this gate

- [ ] No blank screens.
- [ ] No route dead ends.
- [ ] No raw runtime errors visible to the player.
- [ ] No unrecoverable state when a deep link drops the player into a protected route without a local player (covered by `rune-p0-002`).

## 2. Trading Regression Checklist

Goal: buy/sell, position math, Energy/Heat, persistence, and authority routing remain correct under all common player actions.

### 2.1 Authority and economy invariants

- [ ] `LocalAuthority` is the default and is selected when Supabase config is absent (`authority/__tests__/authority-config.test.ts`).
- [ ] `SupabaseAuthority` is selected only when `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true` plus URL and anon key are set (same test file, plus `docs/release/kite-p0-001-supabase-authority.md`).
- [ ] Engine code uses no `Math.random` or `Date.now()` outside `engine/prng.ts` and the documented exception points.
- [ ] Deterministic replay matches across runs (`engine/__tests__/economy-replay.test.ts`; reachable through `npm run replay:economy`).
- [ ] Replay baseline holds: 1000 profitable sessions out of 1000, 0 soft locks, 0 impossible states (`docs/release/oracle-p0-001-economy-replay-harness.md`).

### 2.2 Buy/sell loop

- [ ] Buy decreases 0BOL by `quantity * unit price` and increases inventory by `quantity` for the matching ticker.
- [ ] Sell increases 0BOL by `quantity * unit price` and decreases inventory by `quantity`, never below zero.
- [ ] Realized PnL equals sell proceeds minus weighted average entry, rounded to the engine's documented precision.
- [ ] Unrealized PnL on open positions equals `(current price - average entry) * quantity` per ticker.
- [ ] Lot-size selection respects available 0BOL, available Energy, and inventory caps.

### 2.3 Energy and Heat

- [ ] Trade is rejected with a clear in-world message when Energy is insufficient.
- [ ] Trade is rejected when Heat exceeds the configured cap.
- [ ] Passive Heat decay and Energy recovery progress on tick advance (covered by `engine/__tests__/demo-market.test.ts`).
- [ ] Manual "wait tick" advances the deck clock without granting free Energy beyond the documented rate.
- [ ] One-hour Energy refill action consumes the documented cost and grants the documented Energy amount once per cooldown.

### 2.4 Locations, Heat, and raid pressure

- [ ] Travel between locations applies the documented lockout window.
- [ ] Black Market reduces Heat by the documented amount.
- [ ] Raid trigger conditions match `engine/raid-checker.ts` (covered by `engine/__tests__/raid-checker.test.ts`).
- [ ] Bounty escalation matches `engine/bounty.ts` (covered by `engine/__tests__/bounty.test.ts`).
- [ ] Courier shipments resolve correctly when collected in or out of order.

### 2.5 Missions, news, flash events, district state

- [ ] News headlines render from `engine/news-generator.ts` and survive missed-tick catch-up.
- [ ] NPC missions render from `engine/mission-generator.ts` and accept/decline cleanly.
- [ ] Flash events fire deterministically per `engine/__tests__/flash-events.test.ts`.
- [ ] District state transitions match `engine/__tests__/district-state.test.ts`.
- [ ] Streak and daily challenges progress per `engine/__tests__/streak.test.ts` and `engine/__tests__/daily-challenges.test.ts`.
- [ ] Rank progression matches `engine/__tests__/rank.test.ts`.

### 2.6 Persistence

- [ ] Save/load round-trips player state (`state/__tests__/demo-storage.test.ts`).
- [ ] Reset from `app/menu/settings.tsx` clears stored state and returns the player to a known intro state.
- [ ] Corrupt JSON in MMKV/local storage recovers without crashing (covered by `rune-p0-003`, see `docs/release/rune-p0-003-persistence-coverage.md`).
- [ ] Cold launch on a second run hydrates the same player state.
- [ ] Native cold-launch validation on iOS Simulator and Android Emulator remains a follow-up under `rune-p0-003` and `axiom-p0-001`.

### 2.7 Routes

- [ ] Every route in `app/` and `app/menu/` has a valid back path.
- [ ] Deep-linking to a protected route without a local player recovers via the shared phase-to-route mapper (`rune-p0-002`, see `docs/release/rune-p0-002-route-hardening.md`).
- [ ] Android hardware back from menu/terminal returns safely (no empty stack pop).
- [ ] No route renders a blank screen on first paint.

### 2.8 Cross-surface

- [ ] Production web smoke completes intro -> login -> handle -> terminal -> buy -> sell -> inventory -> profile -> settings against the live deployment.
- [ ] iOS Simulator smoke completes the same path with no clipped critical text and no native crashes.
- [ ] Android Emulator smoke completes the same path with safe hardware back and no native crashes.

## 3. Store Metadata Checklist

Goal: the App Store and Play Store listings are complete, accurate, and policy-safe before submission.

### 3.1 Bundle and identity

- [ ] iOS bundle id `ai.cybertrader.app` and Android package `ai.cybertrader.app` match `app.json` and the EAS profiles in `eas.json`.
- [ ] URL scheme `cybertrader` is registered in `app.json`.
- [ ] App version and build number are bumped per release.
- [ ] Expo SDK 52 toolchain matches what `rune-p0-004` profiles target (Node 20.18.1 on EAS).
- [ ] iOS store-candidate uploads on or after 2026-04-28 are built with Xcode 26 or later and the iOS 26 SDK or later (`cipher-p0-001`).
- [ ] Android store-candidate artifacts target Android 15 / API level 35 or higher (`cipher-p0-001`).
- [ ] Expo SDK 52's default Android target SDK 34 is either removed by a planned SDK upgrade or overridden with verified native build-property evidence before Google Play submission (`cipher-p0-001`).
- [ ] EAS project id `b024b715-6718-4854-b318-c6afbb8788e6` is the only id referenced by build profiles.

### 3.2 Visual assets

- [ ] App icon is present at all required iOS sizes.
- [ ] Adaptive icon and adaptive icon background `#050608` are present for Android (matches `app.json`).
- [ ] Splash background `#050608` matches `app.json` and brand guidelines.
- [ ] Apple screenshots follow the current App Store Connect screenshot specifications: one to ten screenshots, iPhone-first for current `supportsTablet: false`, plus iPad screenshots if that setting changes (`cipher-p0-001`, `palette-p1-003`).
- [ ] Google Play preview assets include a 512 x 512 32-bit PNG icon under 1024 KB, a short description under 80 characters, and screenshot/feature/video assets that avoid misleading ranking, pricing, or call-to-action copy (`cipher-p0-001`).
- [ ] Screenshot scenes contain no debug UI, no placeholder copy, and no out-of-brand colors.
- [ ] Apple preview video is 15-30 seconds, app-capture based, and uses accepted `.mov`, `.m4v`, or `.mp4` specs with no misleading footage (`cipher-p0-001`, storyboard owned by `reel-p0-001`, capture plan signed off by Zoro per `zoro-p0-002`).

### 3.3 Copy

- [ ] Store name, subtitle, and short description are final and reviewed by Zoro.
- [ ] Long description avoids real-money, token-earning, cash-out, investment, or guaranteed-return language (`cipher-p0-002`, see `docs/release/cipher-p0-002-policy-risk-matrix.md`).
- [ ] Keywords are within length limits and avoid policy traps.
- [ ] Support URL is live and routes to a functioning channel.
- [ ] Privacy policy URL is live and reflects actual data handling.
- [ ] Marketing URL or website link is live or omitted.

### 3.4 Age rating and policy

- [ ] Age rating questionnaire reviewed; simulated trading, fictional violence, fictional crime/black-market language, and any future tokenized/chance-based features are flagged honestly (`cipher-p0-002`).
- [ ] Apple App Privacy disclosures align with the data-flow documented in `docs/release/kite-p0-001-supabase-authority.md`: SupabaseAuthority is off by default; LocalAuthority does not transmit identifiable player data.
- [ ] Google Data Safety form aligns with the same data flow.
- [ ] Google Play target audience/app content declarations state the intended non-child audience honestly and do not rely on children-directed imagery or copy (`cipher-p0-001`).
- [ ] Google Play IARC content rating answers cover simulated trading, fictional crime/black-market framing, and any future chance-based mechanics (`cipher-p0-001`).
- [ ] Wallet flag stays off; `0BOL`/`$OBOL` text avoids real-money, redeemability, investment, earning, staking, or withdrawal claims (`cipher-p0-002`, `kite-p1-004`).
- [ ] Loot-box and gambling-adjacent surfaces are explicitly absent or feature-flagged off.

### 3.5 Account and recovery copy

- [ ] First-launch flow does not require a wallet.
- [ ] Account recovery limitations are communicated in-app and in the privacy policy (`kite-p0-002`).
- [ ] No misleading custodial or non-custodial claims appear in store copy.

### 3.6 Build artifacts

- [ ] EAS `internal` profile produces an iOS build that runs on a physical device.
- [ ] EAS `internal` profile produces an Android APK that installs on a physical device.
- [ ] EAS `store` profile produces submission artifacts for both platforms.
- [ ] No production secrets or signing material are committed in repo.
- [ ] EAS environment variables, not the repo, hold any Supabase URLs or anon keys when SupabaseAuthority is enabled in a build.

## Validation

This checklist is a documentation-only deliverable for `axiom-p0-002`. Required validation for this pass:

- v6: `npm run typecheck`, `npm test -- --runInBand`, `npx expo export --platform web`.
- Dev Lab: `cd web && npm run typecheck && npm run build` after the linked task status changes.

## Follow-Ups

- `axiom-p0-001`: execute Web, iOS Simulator, and Android Emulator passes against the checklists above and file blocking bugs.
- `axiom-p1-003`: define cold-start, memory, bundle, and interaction-latency budgets to bind the smoke runs.
- `axiom-p1-004`: build an automated smoke route covering the First-Session checklist for CI and local repeat runs.
- `rune-p0-003`: complete native cold-launch persistence validation referenced in section 2.6.
- `rune-p1-005`: add crash/log capture so checklist failures attach actionable session context.
- `palette-p1-003`, `reel-p0-001`, `zoro-p0-002`: produce store screenshots and preview video to bind section 3.2.
- `kite-p0-002`, `kite-p1-004`: finalize account-recovery and legal/security copy using the `cipher-p0-002` policy matrix as the store-risk baseline.

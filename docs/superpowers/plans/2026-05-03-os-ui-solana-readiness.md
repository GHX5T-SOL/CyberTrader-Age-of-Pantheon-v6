# OS UI Solana Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a focused v6 slice that makes PirateOS, AgentOS, PantheonOS, and feature-flagged Solana readiness visible and testable in the live Expo game.

**Architecture:** Add deterministic engine helpers for OS progression and Solana readiness, then render those contracts through reusable React Native panels on home, progression, and settings. Keep LocalAuthority playable and wallet-free while exposing on-chain `$OBOL` as a guarded capability.

**Tech Stack:** Expo Router, React Native, Zustand, Jest, TypeScript, LocalAuthority, SupabaseAuthority, Solana JSON-RPC helper contracts.

---

### Task 1: OS Progression Contract

**Files:**
- Create: `engine/os-progression.ts`
- Create: `engine/__tests__/os-progression.test.ts`
- Modify: `engine/factions.ts`

- [ ] **Step 1: Write the failing test**

Create tests that assert `getOsProgressionState` returns three ordered tiers, marks PirateOS active at rank 1, AgentOS ready at rank 5 after first profit and Heat <= 70, and PantheonOS ready at rank 20 with a bound faction and enough shard signal.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath engine/__tests__/os-progression.test.ts --runInBand`
Expected: FAIL because `engine/os-progression.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create serializable helpers that derive `activeTier`, `nextTier`, `tiers`, `pantheonReadiness`, and player-facing unlock copy from rank, Heat, first-profit state, faction, and reputation totals. Export constants for `PIRATE_OS_NAME`, `AGENT_OS_NAME`, and `PANTHEON_OS_NAME`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath engine/__tests__/os-progression.test.ts --runInBand`
Expected: PASS.

### Task 2: Solana Readiness Contract

**Files:**
- Create: `solana/obol-readiness.ts`
- Create: `solana/__tests__/obol-readiness.test.ts`
- Modify: `authority/local-authority.ts`
- Modify: `authority/supabase-authority.ts`

- [ ] **Step 1: Write the failing test**

Create tests that assert disabled on-chain mode reports LocalAuthority demo mode, Android reports MWA-ready when feature flag and mint exist, iOS reports limited external-wallet mode, and transfer intents reject missing mint, missing recipient, or non-positive amounts.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath solana/__tests__/obol-readiness.test.ts --runInBand`
Expected: FAIL because `solana/obol-readiness.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create pure helpers for `getObolReadiness`, `buildObolTransferIntent`, and `formatTokenAmount`. Keep network balance reads out of UI and keep all spend flows intent-only.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath solana/__tests__/obol-readiness.test.ts --runInBand`
Expected: PASS.

### Task 3: OS And Wallet UI Panels

**Files:**
- Create: `components/os-status-matrix.tsx`
- Create: `components/solana-readiness-panel.tsx`
- Modify: `app/home.tsx`
- Modify: `app/menu/progression.tsx`
- Modify: `app/menu/settings.tsx`
- Modify: `components/burger-menu.tsx`

- [ ] **Step 1: Render OS contract on home**

Insert `OsStatusMatrix` after route telemetry and before the resource chips. It must stay compact on mobile, use existing terminal colors, and expose the next OS action in one line.

- [ ] **Step 2: Expand progression into OS command center**

Use the same contract to make PirateOS, AgentOS, and PantheonOS status explicit, including Pantheon shard readiness instead of a static locked card.

- [ ] **Step 3: Render Solana readiness in settings**

Replace static token flag copy with `SolanaReadinessPanel`, showing cluster, mint status, platform mode, launch-safe copy, and why LocalAuthority remains playable.

- [ ] **Step 4: Add menu label polish**

Rename `PROGRESSION` to `OS / PROGRESSION` so players can find the new surface without adding a new route.

### Task 4: Verification And Ship

**Files:**
- Modify: any implementation files touched above

- [ ] **Step 1: Focused tests**

Run: `npm test -- --runTestsByPath engine/__tests__/os-progression.test.ts solana/__tests__/obol-readiness.test.ts --runInBand`
Expected: PASS.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Full ship check**

Run: `npm run ship:check`
Expected: PASS.

- [ ] **Step 4: Web QA**

Run: `npm run build:web`
Expected: PASS. Then start Expo web and inspect `/home`, `/menu/progression`, and `/menu/settings`.

- [ ] **Step 5: Commit and push**

Run:
`git add docs/superpowers/plans/2026-05-03-os-ui-solana-readiness.md engine solana components app authority`
`git commit -m "feat: upgrade os and solana readiness surfaces"`
`git push -u v6 codex/game-os-ui-solana-trailer-20260503`

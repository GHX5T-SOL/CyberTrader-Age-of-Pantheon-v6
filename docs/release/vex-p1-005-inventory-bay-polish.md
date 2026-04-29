# vex-p1-005 - Inventory Bay Empty-State Polish

Date: 2026-04-29
Owner: Vex/Codex
Status: Shipped to v6 main.

## Scope

The `/menu/inventory` route was the weakest empty surface in the first 10-minute Gate A loop: a one-line `0/5 SLOTS` block, a small dim "NO COMMODITIES HELD" string, then a tall sea of black with no diegetic context and no path back into the trading loop. This pass turns that empty bay into a cyberdeck cargo bay readout that respects the existing terminal tokens, story posture, and store-safe copy.

## Player-Facing Changes

- Existing slot rail now sits on a single row with `SLOTS` and `COURIERS` legible side-by-side, plus a per-bay sub-line: `BAY // <DISTRICT> // <USED> OF <TOTAL> BERTHS LIVE`.
- When the bay is empty, the route now renders three new diegetic blocks inside the existing `NeonBorder`:
  - `BAY STATUS` panel with a 4-line ASCII bay frame and the preserved `NO COMMODITIES HELD` headline so QA markers stay valid while the surface stops feeling like a stub.
  - `ORACLE STARTER MANIFEST` panel — pulls live `getStrategyCueLines("VBLM", { firstTradeComplete })` so the recommended starter route always matches the rest of the app, then stacks `PROJ COST` (live VBLM × `STARTER_GUIDANCE_QUANTITY` price) and `LIQUID` 0BOL on a clear right-aligned column.
  - `[ OPEN TERMINAL ]` 48 px CTA that uses `router.replace("/terminal")` so a brand-new agent or any returning agent with empty cargo can re-enter the trade loop in one tap.
- A new `IN-TRANSIT MANIFEST` block now appears under the main bay panel whenever active courier shipments are out, listing the first four packets with `<TICKER> x<QTY>` and `<DEST> // <ETA>` so an agent with empty bay slots but live couriers can still read the deck state without leaving the route.
- All copy stays store-safe: no on-chain language, no real-money/payout claims, no `$OBOL` (uses `0BOL` per the `kite-p1-004` boundary), and no claims that change the simulated economy.
- Existing position-list rendering is unchanged — the QTY/AVG/VALUE/PNL row and `[ SEND VIA COURIER ]` action still ship as before when the bay is non-empty.

## Surfaces Untouched

- `MenuScreen title="COMMODITY INVENTORY"` (Axiom QA marker preserved).
- `0/5 SLOTS` text (Axiom QA marker preserved — still visible on every load).
- `NO COMMODITIES HELD` text (preserved as the empty-state headline so the legacy Axiom regex match in `qa/axiom-web-regression.spec.ts` still hits).
- Courier modal flow.

## Validation

- `npm run safety:autonomous` (clean, 1 file checked)
- `npm run typecheck`
- `npm test -- --runInBand` (181/181 Jest tests across 37 suites)
- `npm run build:web` (Expo web export clean)
- `npm run qa:smoke` (1/1 Playwright smoke through inventory)
- `npm run qa:responsive` (4/4 viewports)
- `npm run capture:screenshots` — refreshed all six store-screenshot presets (home, terminal, market, missions, inventory, profile)
- `npm run provenance:assets` — 39 assets remain inventoried; no new external imagery introduced
- `npm run health:live` (Vercel HTTP 200, content-type `text/html`, vercel cache HIT)
- `npm run qa:axiom:live` (live deployment shell still serves the non-blank app shell)

## Diegetic Direction

- Reuses the existing `terminalColors`, `terminalFont` JetBrains Mono, neon-cyan rail, amber Oracle accent, and green liquid-balance tone — no new palette or generic purple gradients introduced. Stays inside the brand boundary documented in `brand/brand-guidelines.md`.
- ASCII bay frame fits the cyberdeck surface vocabulary established by `vex-p1-004` packet headers and the `system-state-panel` empty/loading vocabulary.

## Follow-up Hooks

- A future pass could move the `Oracle Starter Manifest` block to a shared component if other empty surfaces (e.g. an empty `/missions` archive) want the same treatment. For now it lives inline to keep the change scoped.

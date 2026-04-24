# /src - Mobile app (Expo + React Native)

Phase 1 now has a real routed playable slice:
- `boot`
- `handle`
- `terminal`
- `market`

The app is no longer a single-screen placeholder. It persists the local demo
session, hydrates on reload, and runs the first trade loop through
`LocalAuthority`.

## Structure

```text
src/
|-- app/                    <- Expo Router routes
|   |-- _layout.tsx
|   |-- index.tsx          <- hydration + redirect entry
|   |-- boot.tsx
|   |-- handle.tsx
|   |-- terminal.tsx
|   `-- market.tsx
|-- assets/
|   |-- commodity-art.ts   <- ticker-to-image mapping
|   |-- commodities/       <- local PNG art used by the mobile market
|   `-- ui/                <- shard core + other player-facing visual anchors
|-- authority/
|   |-- index.ts
|   |-- local-authority.ts
|   |-- supabase-authority.ts
|   `-- __tests__/
|-- components/            <- reusable terminal UI pieces
|-- engine/                <- deterministic market + shared types
|-- hooks/                 <- bootstrap + market loop hooks
|-- screens/
|   `-- first-playable/    <- screen implementations used by routes
|-- cinematics/            <- Remotion teaser scaffold for the vertical slice
|-- state/
|   |-- demo-routes.ts
|   |-- demo-storage.ts
|   `-- demo-store.ts
`-- theme/
    `-- colors.ts
```

## Run

```bash
cd src
npm install
npx expo start
```

Web export from repo root:

```bash
npm run build:mobile:web
```

## Current slice

The current working demo proves:
- BIOS boot screen to terminal transition
- local handle claim
- deterministic ticking market
- authority-backed buy/sell loop
- local persistence across reload
- commodity art rendering in the market
- Eidolon shard centerpiece rendering in boot and hydration
- guided first-trade objective panel
- open-position visibility with live unrealized PnL
- authority-fed market rumor panel
- selected ticker mini price chart
- one-hour Energy refill action

## Cinematics

The repo now includes a working Remotion scaffold at `src/cinematics`.

Useful commands:

```bash
npm run generate:cinematic
npm run render:cinematic
```

## Design rules

- No hex codes in components. Import from `@/theme/colors`.
- Engine code stays deterministic. No `Math.random` or `Date.now()` in `src/engine`.
- Authority is the write boundary. UI should not mutate trade state directly.
- Keep player-facing screens diegetic. This is a cyberdeck, not a dashboard.

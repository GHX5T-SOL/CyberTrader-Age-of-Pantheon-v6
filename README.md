# /src - Mobile app (Expo + React Native)

Phase 1 now has a real routed playable slice:
- `boot`
- `handle`
- `terminal`
- `market`

The app now starts like a mobile game: cinematic intro, local login, command
dashboard, then the S1LKROAD market dashboard. It persists the local demo
session, hydrates on reload, and runs the first trade loop through `LocalAuthority`.

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
- cinematic intro video to login transition
- mobile-first local handle claim
- dashboard with Game, Tutorials, and Settings entry points
- deterministic ticking market
- authority-backed buy/sell loop
- local persistence across reload
- commodity art rendering in the market
- S1LKROAD dashboard styled after the approved Pirate OS mobile concept
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

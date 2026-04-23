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
|   `-- commodities/       <- local PNG art used by the mobile market
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

## Design rules

- No hex codes in components. Import from `@/theme/colors`.
- Engine code stays deterministic. No `Math.random` or `Date.now()` in `src/engine`.
- Authority is the write boundary. UI should not mutate trade state directly.
- Keep player-facing screens diegetic. This is a cyberdeck, not a dashboard.

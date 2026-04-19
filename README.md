# /src — Mobile app (Expo + React Native)

Phase 0 scaffold. Frontend/Mobile Agent fleshes this out in Phase 1.

## Structure

```
src/
├── package.json       ← mobile-specific deps
├── app.json           ← Expo config
├── tsconfig.json      ← TS config with @/ and @brand/ path aliases
├── app/               ← Expo Router screens
│   ├── _layout.tsx    ← root layout + gesture handler
│   └── index.tsx      ← boot screen (Phase 0 placeholder)
├── components/        ← reusable UI components (empty, ready)
├── state/             ← Zustand stores (empty, ready)
├── engine/            ← pure TS game engine
│   ├── prng.ts        ← Mulberry32 + xfnv1a seeded PRNG
│   ├── types.ts       ← authoritative data model + Authority interface
│   └── __tests__/
│       └── prng.test.ts
└── theme/
    └── colors.ts      ← re-exports brand palette
```

## Run

```bash
cd src
npm install
npx expo start
```

## Design rules

- **No hex codes in components.** Import from `@/theme/colors` or `@brand/color/tokens`.
- **No Redux/MobX/Recoil.** Zustand only.
- **No charts requiring native linking.** SVG charts only in Phase 1.
- **No placeholder main-nav screens in production.** Use feature flags.
- **Engine is pure.** No `fetch`, no `Date.now()`, no `Math.random` in `src/engine/`.

See [../agents/frontend-mobile.md](../agents/frontend-mobile.md) for more.

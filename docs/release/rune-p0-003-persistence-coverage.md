# rune-p0-003 - Persistence Coverage

Date: 2026-04-26
Owner: Rune

## Scope

Added regression coverage for the demo persistence adapter so native storage behavior is verified before simulator/device cold-launch QA.

## Covered Paths

- Persisted demo session save/load through the native MMKV adapter.
- Settings reset clearing the persisted session key.
- Corrupt persisted JSON removal with a clean null recovery.

## Validation

- `npm test -- --runInBand state/__tests__/demo-storage.test.ts`
- Relevant monitor checks also passed on this run: `npm run typecheck`, `npm test -- --runInBand`, and `npx expo export --platform web`.

## Remaining Work

- Validate cold-launch persistence on iOS simulator and Android emulator.
- Keep LocalAuthority fully playable while SupabaseAuthority remains behind feature-flag work.

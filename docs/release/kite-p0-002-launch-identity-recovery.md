# kite-p0-002 - Launch Identity And Account Recovery

Date: 2026-04-28
Owner: Kite

## Scope

This pass defines the launch-safe identity and recovery model for the first playable CyberTrader v6 release. It does not enable SupabaseAuthority, create a live backend account, request a wallet, submit store forms, perform on-chain actions, or introduce real-money functionality.

## Launch Decision

The launch identity model is **LocalAuthority-only demo identity**:

- Players claim a local Eidolon handle with 3-20 letters, numbers, or underscores.
- The app creates a local player profile with `walletAddress: null`.
- `devIdentity` is derived from the lowercase handle only.
- No wallet, payment method, Supabase credential, email, password, seed phrase, or external account is required for first-session play.
- `0BOL` remains a soft in-game currency with no cash value and no withdrawal path.

The code contract lives in `authority/launch-identity.ts`. `state/demo-store.ts` now uses the same helper for both boot-time and direct handle submission profile creation, so the default path cannot accidentally add a wallet or backend requirement.

## Account Recovery Model

LocalAuthority recovery is intentionally limited:

- Handle, progress, ledger, positions, settings, and LocalAuthority snapshots are stored on the current device.
- `CLEAR LOCAL DATA` removes local demo state from that device.
- Cross-device recovery is unavailable in LocalAuthority launch builds.
- SupabaseAuthority recovery, deletion, retention, and RLS evidence require a separate reviewed scope decision before any store build enables it.

This limitation is now represented in player-facing copy on login, Settings, and Legal Disclosures through shared constants from `authority/launch-identity.ts`.

## Store And Privacy Notes

Reviewer notes for LocalAuthority builds:

- The submitted build is playable through the built-in local demo path.
- No demo account, wallet, payment method, or Supabase credentials are required.
- SupabaseAuthority is disabled unless the submitted build explicitly documents and declares it.
- Legal copy remains accessible through `LEGAL DISCLOSURES`.

Privacy notes for LocalAuthority builds:

- Gameplay state is stored on device.
- Reset/deletion is handled by the Settings `CLEAR LOCAL DATA` action.
- SupabaseAuthority would change data handling and requires updated App Privacy, Google Data Safety, retention, deletion, processor, and RLS notes before enablement.

## Validation

- `authority/__tests__/launch-identity.test.ts` verifies the no-wallet/no-backend/no-payment policy, handle rules, LocalAuthority-safe profile input, recovery limitations, and store-safe copy guard.
- Existing authority and storage coverage remains responsible for local save/load, reset clearing, corrupt JSON recovery, and LocalAuthority first-session behavior.

Checks for this pass:

- `npm run ship:check` passed on 2026-04-28 with the autonomous safety scan, `npm run typecheck`, 139/139 Jest tests in 30 suites, and `npm run build:web`.

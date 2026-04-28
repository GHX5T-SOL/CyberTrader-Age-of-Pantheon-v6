# kite-p1-004 Store-Safe Wallet And Token Boundaries

**Task:** kite-p1-004  
**Owner:** Kite  
**Date:** 2026-04-28

## Scope

This pass completes the security review for `$OBOL` naming, wallet flags, and non-custodial boundaries in the launch build. It does not enable SupabaseAuthority, wallet connect, token transfers, purchases, on-chain actions, real-money rewards, or store submission.

## Current Launch Boundary

- `LocalAuthority` remains the launch default.
- First-session play needs only a local handle.
- No wallet, payment method, backend account, Supabase credential, or signing material is required for the playable loop.
- `0BOL` remains a soft in-game currency with no cash value and no withdrawal path.
- `$OBOL` and wallet flows remain future optional scope only, disabled unless a later reviewed build enables them with region, store, and legal evidence.
- Any future wallet layer must be optional and non-custodial. The app must never ask players for private signing material.

## Code Changes

- `authority/store-safety.ts` centralizes the launch boundary, reviewer copy, and forbidden store-copy pattern checks.
- `authority/launch-identity.ts` now uses the shared store-safety guard instead of its own narrower regex.
- `app/menu/legal.tsx` now renders shared legal/reviewer-safe copy for `0BOL`, future `$OBOL`, no-wallet launch, deterministic local simulation, and no gambling/prize mechanics.
- `app/menu/settings.tsx` now states `SOLANA TOKEN MODE: DISABLED FOR LAUNCH` and surfaces the wallet feature-flag boundary.
- `authority/__tests__/store-safety.test.ts` verifies safe launch/reviewer copy, catches prohibited real-money/investment/regulated-market/prize/signing-material claims, and proves wallet capability stays disabled unless explicitly feature-flagged.

## Review Notes

The review builds on `cipher-p0-002` and its verified Apple/Google policy source set. The guard is not a substitute for legal review or final App Store / Play Store declarations; it is a local engineering gate to prevent obvious unsafe claims from entering launch copy.

Gate C still needs a public privacy policy URL, final App Privacy / Data Safety answers, conservative age-rating answers, and native store-toolchain evidence.

## Validation

Run on 2026-04-28:

```bash
npm test -- authority/__tests__/store-safety.test.ts --runInBand
npm run ship:check
```

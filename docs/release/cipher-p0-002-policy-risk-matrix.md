# cipher-p0-002 - Privacy, Token, Trading, And Age-Rating Risk Matrix

Date: 2026-04-26
Owner: Cipher

## Scope

This note completes `cipher-p0-002` by mapping the store-policy and legal-review risks around CyberTrader v6 privacy handling, `0BOL`/`$OBOL` naming, simulated trading, wallet flags, and age-rating declarations.

This is policy research and product-risk planning, not legal advice. It did not submit store forms, access store credentials, perform on-chain actions, enable real-money functionality, or change the launch authority mode.

## Source Set

Verified official sources on 2026-04-26:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple App Store Connect Age Ratings: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Google Play Developer Policy Center: https://play.google/developer-content-policy/
- Google Play User Data Policy: https://support.google.com/googleplay/android-developer/answer/9888076
- Google Play Data Safety Form: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play Financial Services Policy: https://support.google.com/googleplay/android-developer/answer/9876821
- Google Play Blockchain-based Content Policy: https://support.google.com/googleplay/android-developer/answer/13607354
- Google Play Real-Money Gambling, Games, And Contests Policy: https://support.google.com/googleplay/android-developer/answer/9877032
- Google Play Payments Policy: https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play Content Ratings: https://support.google.com/googleplay/android-developer/answer/9898843
- Google Play Target Audience And App Content: https://support.google.com/googleplay/android-developer/answer/9867159

## Current v6 Product Posture

- `LocalAuthority` is the launch default. First-session play does not require a wallet, account, email, payment method, or Supabase project.
- `SupabaseAuthority` is feature-flagged and only initializes when public Supabase config is present.
- `app/menu/legal.tsx` already says this is a game, not financial advice; `0BOL` is non-withdrawable and has no cash value; `$OBOL` is optional future scope; Phase 1 does not require a wallet; and demo trading is deterministic local simulation.
- There are no in-app purchases, paid subscriptions, ads, loot boxes, cash prizes, withdrawals, or on-device cryptomining flows in the current v6 codebase.
- `app.json` uses iOS bundle id and Android package `ai.cybertrader.app`, portrait-only orientation, and `supportsTablet: false`.

## Risk Matrix

| Area | Current Launch Posture | Store Declaration Impact | Risk | Required Action |
| --- | --- | --- | --- | --- |
| Local-only player state | Gameplay state, handle, ledger, positions, settings, and progression stay on device under LocalAuthority. | Apple App Privacy and Google Data Safety can be drafted around no transmitted identifiable player data for LocalAuthority, but local gameplay content still needs accurate privacy-policy language. | Low | Keep LocalAuthority default for Gate A/B. Privacy policy must say local gameplay data is stored on device and can be cleared by reset controls. |
| SupabaseAuthority | Adapter is off unless flags and public config are present. Anonymous auth can create a backend session when enabled. | Apple App Privacy, Google Data Safety, privacy policy, and deletion copy must change if a build enables Supabase. | Medium | Gate C must choose LocalAuthority-only or Supabase-enabled scope before store forms are finalized. If Supabase is enabled, document collected identifiers, gameplay content, diagnostics, retention, deletion, and processors. |
| `0BOL` soft currency | In-game, non-withdrawable, no cash value, used only for local progression and simulated trades. | Store copy should treat `0BOL` as game currency, not a financial instrument, crypto asset, reward, or purchase item. | Low | Keep `0BOL` wording as "soft in-game currency" and "no cash value." Do not imply redeemability, investment value, yield, staking, or transfer. |
| `$OBOL` future token | Mentioned as optional future Solana token layer, disabled for Phase 1. | Apple and Google treat crypto exchanges, wallets, tokenized assets, and financial features as regulated/sensitive. Future enablement changes review notes, declarations, and legal evidence. | High if enabled | Keep wallet/token features disabled for launch unless Ghost/Kite provide region, licensing, store-declaration, and legal review evidence. Any enabled tokenized asset flow requires Play Financial features/blockchain declarations and Apple review notes. |
| Wallet connect | No wallet required for first launch. | Wallet prompts can look like financial or crypto exchange functionality unless narrowly framed and optional. | Medium | Do not gate gameplay behind wallet connect. If added, make it optional, region-aware, non-custodial, and clearly separated from LocalAuthority demo play. |
| Simulated trading | Fictional commodity trading with local deterministic prices and no real-world market access. | Apple/Google age and content declarations should answer simulated trading/black-market themes honestly. Avoid financial-services positioning. | Medium | Store descriptions should call this a strategy game or simulated market game. Do not use "real trading," "earn," "profit," "investment," "cash out," "portfolio returns," or real exchange language. |
| Binary options / derivatives | No binary options, CFDs, FOREX, securities, loans, or real market instruments. | Apple and Google restrict or prohibit some real financial trading categories. | Low while absent | Keep real-world finance surfaces out of launch. Escalate if any real market data, securities, derivatives, loan, or personalized financial advice feature is proposed. |
| Gambling / prizes | No real-money wagering, no cash prizes, no paid chance mechanics, no loot boxes. | Real-money games and gambling policies become high-risk if any prize, wager, paid chance, or redeemable value appears. | Low while absent | Keep "no gambling loops, no loot boxes, no real-money prizes" in legal/store policy copy. If randomized paid rewards are introduced, require odds disclosure and legal review before implementation. |
| Age rating | Cyberpunk black-market tone, fictional commodities, simulated trading pressure, and no explicit real-world gambling. | Apple age ratings and Google IARC answers must account for simulated trading, mature themes, fictional crime/contraband, and any future chance-based or tokenized features. | Medium | Draft conservative questionnaire answers before Gate C. Do not target children. If ratings come back lower than the intended audience, Ghost/Zoro can raise the target age in store metadata. |
| Privacy policy availability | No committed public privacy policy URL yet. | Apple requires a privacy policy in metadata and in-app access; Google requires privacy policy coverage for user/device data practices and Data Safety alignment. | High until drafted | Gate C needs a live privacy policy URL covering LocalAuthority, reset/deletion, support contact, future Supabase mode, and third-party SDKs. Add in-app link once URL exists. |
| App access / review notes | Demo can run locally without backend credentials. | Reviewers need clear instructions if Supabase stays off and no login account is required. | Low | App Review and Play notes should state: no wallet, no payment, no backend account required; use built-in demo flow; SupabaseAuthority is disabled in the submitted build unless otherwise declared. |
| Third-party SDKs | Expo, React Native, Supabase, MMKV, and related SDKs are present. | Apple privacy details and Google Data Safety must account for third-party SDK collection if enabled in shipped builds. | Medium | Native build evidence must include SDK/privacy manifest review. Data Safety and App Privacy must reflect third-party SDK behavior, not just first-party code. |

## Required Policy Copy Inventory

The following copy needs to exist before Gate C submission. Draft wording can start from this list, but final language needs Ghost/Zoro approval and legal review if token or wallet features are enabled.

### Store Description Guardrails

- CyberTrader is a fictional cyberpunk strategy game with simulated local-market trading.
- Demo trades use fictional commodities and game state only.
- `0BOL` is an in-game progression currency with no cash value.
- No real-money trading, withdrawals, staking, yield, loans, securities, binary options, CFDs, FOREX, gambling, loot boxes, or cash prizes.
- Wallet connection is not required for first-session play.
- Avoid guaranteed-return, play-to-earn, investment, alpha, arbitrage, cash-out, passive-income, or real-market claims.

### In-App Legal Copy

- This is a game, not financial advice.
- `0BOL` is a soft in-game currency; it is non-withdrawable and has no cash value.
- Phase 1 uses local simulated trading and does not require a wallet.
- `$OBOL` or any wallet/token layer is future optional scope only, subject to supported regions and compliant flows.
- Reset controls clear local demo state on the device.

### Privacy Policy Copy

- For LocalAuthority builds: describe on-device storage of handle, gameplay progress, trades, positions, settings, and reset/deletion behavior.
- If SupabaseAuthority is enabled: disclose anonymous auth/session identifiers, backend player state, ledger/events, support or diagnostic data, retention, deletion request process, processors, security measures, and regional availability.
- Disclose that store/payment credentials are not collected by the app in the current build because there are no purchases.
- Disclose third-party SDKs and any diagnostics/crash logs if `rune-p1-005` adds capture hooks.

### Reviewer Notes

- The submitted build is playable through the built-in local demo path.
- No demo account, wallet, payment method, or Supabase credentials are required unless the submitted build explicitly enables SupabaseAuthority.
- Any future token/wallet screen is disabled or not reachable in the submitted build.
- App Store/Play reviewers can verify legal copy in `LEGAL DISCLOSURES`.

## Legal Escalation Triggers

Escalate to Ghost, Kite, and a human legal reviewer before implementation or store submission if any of these becomes true:

- Wallet connect becomes part of onboarding, progression, account recovery, or trading.
- `$OBOL`, NFTs, or any tokenized asset can be bought, earned, transferred, withdrawn, staked, redeemed, or exchanged.
- Any real-money purchase buys game currency, trading access, randomized rewards, or a chance to receive something of monetary value.
- Any contest, sweepstakes, tournament, leaderboard prize, cash reward, gift card, or outside-of-app reward is introduced.
- Store copy uses financial/investment language or references real-world securities, derivatives, crypto exchange behavior, or actual market prices.
- SupabaseAuthority is enabled for a store build before privacy, deletion, RLS, retention, and processor disclosures are complete.
- Ads, analytics, attribution SDKs, push notifications, or crash-log SDKs are added before Data Safety/App Privacy answers are revised.
- The app targets children, uses child-directed imagery, or includes under-13/under-16 users in its intended target audience.
- App availability includes jurisdictions where crypto, simulated gambling, prize competitions, or black-market/crime themes require additional local review.

## Gate Impact

Gate A remains unblocked because the current demo is LocalAuthority-only and does not perform real-money, wallet, or backend actions.

Gate B remains blocked by native runtime evidence, not by this policy matrix. If native builds add crash capture or Supabase flags, Axiom must update Data Safety/App Privacy assumptions before using the evidence for Gate C.

Gate C remains blocked until:

- A public privacy policy URL exists and is linked in store metadata and in-app copy.
- Apple App Privacy and Google Data Safety drafts are bound to the selected LocalAuthority-only or Supabase-enabled launch scope.
- Apple age rating and Google IARC answers are drafted conservatively for simulated trading, fictional crime/black-market tone, and any mature themes.
- Store descriptions avoid real-money, investment, earning, and crypto-promotion claims.
- Ghost decides whether `$OBOL`/wallet language stays future-scope only for launch.

## Validation

This is a research and documentation pass. Source verification used official Apple and Google documentation available on 2026-04-26.

Required local validation for this pass:

- v6: docs-only change, no app code changed.
- Dev Lab after planning sync: `cd web && npm run typecheck && npm run build`.

# ghost-p0-002 - Architecture Risk Audit

Date: 2026-04-26
Owner: Ghost

## Scope

This audit reviews CyberTrader v6 for App Store / Play Store submission risk after the Rune technical audit, EAS profile pass, Oracle replay harness, Ghost release-authority bar, and Kite SupabaseAuthority flag boundary.

The current launch-safe path remains the local, simulated trading demo. This audit does not approve on-chain actions, real-money actions, credential operations, or production data changes.

## Current Architecture

- Runtime: Expo SDK 52, Expo Router 4, React Native 0.76, React 18, TypeScript strict mode.
- Routes: Expo Router player routes under `app/`, with route recovery and Android/menu back-path hardening already documented in `rune-p0-002`.
- State: Zustand store in `state/demo-store.ts` drives the first playable loop and persists through `state/demo-storage.ts`.
- Local persistence: web uses `localStorage`; native uses `react-native-mmkv` under the `cybertrader.phase1.terminal-frontend.v4` key.
- Authority: `LocalAuthority` is default. `SupabaseAuthority` is selected only when the explicit SupabaseAuthority flag and public Supabase config are present.
- Economy validation: `oracle-p0-001` replay harness reports 0 soft locks and 0 impossible states for the current baseline.
- Native build path: `eas.json` contains preview, iOS simulator, internal, store, and production profiles with LocalAuthority-safe defaults.
- EAS runtime: the shared base profile now pins Node `20.18.1`, matching Expo SDK 52's documented minimum Node `20.18.x` line.

## External Store And Toolchain Constraints Checked

Official source checks on 2026-04-26 found three constraints that affect the build plan:

- Apple says that beginning 2026-04-28, App Store Connect uploads must be built with Xcode 26 or later and the matching 2026 platform SDKs. The first iOS store-candidate EAS build must prove the selected build image satisfies that requirement.
- Google Play says new Android apps and app updates must target Android 15 / API level 35 or higher. The first Android internal/store build must confirm the resolved target SDK.
- Expo's SDK 52 version table maps the project stack to React Native 0.76, React 18.3.1, React Native Web 0.19.13, and minimum Node `20.18.x`.
- Expo's New Architecture guide notes that SDK 52 initializes new projects with New Architecture enabled by default, and recommends newer SDKs for the latest New Architecture fixes. v6 has `newArchEnabled: true`, so native smoke is still required before Gate B.
- Apple third-party SDK rules require privacy-manifest coverage for listed SDKs when submitting apps that include them. No app-store upload should proceed until the native dependency manifest output is reviewed.

References:

- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple Third-party SDK requirements: https://developer.apple.com/support/third-party-SDK-requirements/
- Google Play target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Expo SDK 52 version table: https://docs.expo.dev/versions/v52.0.0/
- Expo New Architecture guide: https://docs.expo.dev/guides/new-architecture/

## Expo SDK And Dependency Risks

`npm audit --omit=dev --audit-level=high` still reports 20 production advisories: 15 high and 5 moderate.

The advisories are transitive through the Expo toolchain and include:

- `@xmldom/xmldom` through Expo config/plist packages.
- `tar` through Expo CLI cache dependencies.
- `postcss` through Expo metro config dependencies.
- `uuid` through Expo rudder/bunyan and xcode dependencies.

`npm audit fix --force` proposes installing `expo@49.0.23`, which is a breaking downgrade from the current SDK 52 track. Do not run the forced fix as an autonomous patch. The acceptable remediation paths are a planned Expo SDK upgrade, a targeted override review, or explicit Ghost risk acceptance after build/export checks.

The audit also corrected the EAS base Node version from `20.11.0` to `20.18.1` so the remote build profile follows Expo SDK 52's documented minimum Node `20.18.x` line.

## Storage Boundary Review

The storage boundary is acceptable for Gate A web demo and partially acceptable for Gate B native testing.

Positive findings:

- `loadDemoSession` returns `null` when storage is unavailable, so web export and unsupported runtimes fail open to a fresh local session instead of crashing.
- Corrupt persisted JSON is removed and recovered to a clean session.
- Settings reset clears the persisted session key.
- The persisted payload includes the LocalAuthority snapshot so local balances, positions, resources, and rank can resume without remote authority calls.
- Jest regression coverage exists for save/load, reset clearing, and corrupt JSON recovery.

Remaining risk:

- Cold-launch persistence is not yet validated on iOS simulator or Android emulator.
- No migration/version layer exists beyond the storage key. Future persisted-shape changes should either bump the key or add schema validation.
- Storage writes are best-effort and silent if MMKV is unavailable. This is acceptable for demo resilience, but QA should verify a player-facing recovery path before store builds.

Owner: Rune for persistence implementation; Axiom for native cold-launch validation.

## Authority Boundary Review

The authority boundary is acceptable for Gate A and remains store-safe with the `ghost-p1-005` LocalAuthority-only launch decision. SupabaseAuthority still needs live project, RLS, privacy, and native evidence before any submitted build enables it.

Positive findings:

- `LocalAuthority` remains the default path.
- `SupabaseAuthority` requires `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true` plus public URL and anon key.
- Missing Supabase config falls back to LocalAuthority.
- EAS profiles set `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=false` by default.
- No service-role key, wallet private key, signing material, or on-chain action is required in the client bundle.
- Store/legal copy already states the Phase 1 demo does not require a wallet.

Remaining risk:

- Live Supabase migrations, RLS policies, RPCs, and Edge Functions are documented but not validated against a real project.
- Anonymous Supabase auth is client-initialized when enabled; privacy copy and account recovery expectations need a Ghost/Kite/Cipher decision.
- `$OBOL` and wallet flags must remain clearly simulated or disabled until legal/security review is complete.

Owner: Kite for Supabase implementation and RLS evidence; Ghost for launch-scope decision; Cipher for store-policy review.

## Top Technical Risks

| Rank | Risk | Impact | Owner | Required evidence |
| --- | --- | --- | --- | --- |
| 1 | iOS simulator and Android emulator smoke runs are still pending. | Native blank screens, route issues, MMKV failures, or gesture issues may be missed before internal testing. | Axiom / Rune | Simulator and emulator smoke notes with logs/screenshots. |
| 2 | Cold-launch native persistence is not device-validated. | Returning players could lose or corrupt local demo progress on native runtime. | Rune / Axiom | Cold launch, reset, and corrupt-storage recovery validated on native runtime. |
| 3 | Expo transitive advisories and SDK/toolchain drift remain unresolved. | Store submission risk if dependency scrutiny escalates, Xcode/Android target requirements move ahead of the chosen EAS images, or Expo SDK 52 falls behind New Architecture fixes. | Ghost / Rune | SDK upgrade, targeted override review, resolved EAS build image/toolchain evidence, or explicit risk acceptance with passing checks. |
| 4 | SupabaseAuthority live backend is not validated. | Flagged remote authority could fail account bootstrap, trades, ledgers, or RLS isolation. | Kite | Migrations, RLS, RPC/Edge Function validation, and authority write tests against a real project. |
| 5 | Supabase launch scope is deferred. | A future online-authority build could drift without live RLS, privacy, and native evidence. | Ghost / Kite | `ghost-p1-005` LocalAuthority-only scope decision is accepted; future SupabaseAuthority enablement requires live evidence. |
| 6 | Production web smoke is shallow. | Gate A may miss login/trading/inventory/settings regressions. | Axiom | Repeatable smoke path from intro through first profitable sell and settings reset. |
| 7 | Crash/log capture is not implemented. | TestFlight/Play Internal Testing bugs may be hard to diagnose safely. | Rune / Axiom | Secret-safe runtime exception and session-context capture path. |
| 8 | Store policy copy is incomplete. | Simulated trading, token naming, wallet, privacy, and age-rating language could block review. | Cipher / Kite / Ghost | Policy matrix, privacy copy, age-rating notes, and legal escalation triggers. |
| 9 | Store assets are incomplete. | Submission cannot proceed without icon, splash, screenshots, preview, and ownership evidence. | Zoro / Palette / Reel | Asset manifest plus screenshot/preview approval notes. |
| 10 | Autonomous rollback protocol is not finished. | A bad direct-to-main automation commit could take longer to detect and revert. | Talon / Ghost | Rollback and incident protocol with detection signals and revert path. |

## Ghost Decision

`ghost-p0-002` is complete for the current architecture state. The architecture is acceptable for continued Gate A Reliable Demo work, but not yet approved for Gate B Native Internal Testing until native smoke, cold-launch persistence validation, and the first build-plan approval are complete.

Ghost now accepts the current launch default as LocalAuthority-only in `ghost-p1-005`; SupabaseAuthority remains deferred until Kite provides live Supabase, RLS, privacy, and native-runtime evidence.

## Validation

This pass is a scoped build-configuration and release-documentation change.

- Current dependency risk was rechecked with `npm audit --omit=dev --audit-level=high`.
- EAS Node was aligned with the Expo SDK 52 minimum.
- `npx eas-cli config --profile preview-simulator --platform ios --non-interactive --json` resolved Node `20.18.1`.
- `npx eas-cli config --profile store --platform android --non-interactive --json` resolved Node `20.18.1`.
- No v6 runtime app code changed in this task; the only implementation patch is build configuration plus release documentation.
- Dev Lab planning sync must pass `web` typecheck and build after the task status changes.

## Follow-Ups

- `ghost-p0-003`: approve the first TestFlight and Play Internal Testing build plan after Axiom web/native QA evidence exists.
- `rune-p0-003`: finish native cold-launch persistence validation.
- `axiom-p0-001`: run Web/iOS/Android QA and production export smoke.
- `ghost-p1-005`: completed LocalAuthority-only launch scope; future SupabaseAuthority enablement needs live RLS, privacy, and native evidence.
- `talon-p0-002` / `talon-p1-003`: harden direct-push safety rails and rollback protocol.

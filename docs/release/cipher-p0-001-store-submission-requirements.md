# cipher-p0-001 - Store Submission Requirements

Date: 2026-04-26
Owner: Cipher

## Scope

This note records the current official App Store, Play Store, and Expo/EAS submission requirements that affect CyberTrader v6. It completes `cipher-p0-001` by citing current sources, mapping the requirements to the existing v6 build configuration, and updating the submission checklist owned by `axiom-p0-002`.

This pass did not submit builds, run remote EAS jobs, access store credentials, perform on-chain actions, or approve real-money/token functionality.

## Source Set

Verified official sources on 2026-04-26:

- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Apple App Store Connect Age Rating Help: https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Apple Screenshot Specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Apple App Preview Specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/
- Apple Third-party SDK Requirements: https://developer.apple.com/support/third-party-SDK-requirements/
- Google Play Target API Requirement: https://support.google.com/googleplay/android-developer/answer/11926878
- Android Developers Target API Requirement: https://developer.android.com/google/play/requirements/target-sdk
- Google Play Data Safety Form: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play Target Audience And App Content: https://support.google.com/googleplay/android-developer/answer/9867159
- Google Play Content Ratings: https://support.google.com/googleplay/android-developer/answer/9898843
- Google Play Preview Assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Google Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756
- Expo SDK 52 Reference: https://docs.expo.dev/versions/v52.0.0/
- Expo SDK 52 Changelog: https://expo.dev/changelog/2024-11-12-sdk-52
- Expo Submit To App Stores: https://docs.expo.dev/deploy/submit-to-app-stores/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/

## Current v6 Build Identity

- Expo SDK: `~52.0.0`
- React Native: `0.76.9`
- Node pinned for EAS: `20.18.1`
- iOS bundle id: `ai.cybertrader.app`
- Android package: `ai.cybertrader.app`
- URL scheme: `cybertrader`
- EAS project id: `b024b715-6718-4854-b318-c6afbb8788e6`
- Store build profile: `eas.json` `store`, with Android `app-bundle`
- Launch authority default: `LocalAuthority`; `SupabaseAuthority` remains off unless explicitly flagged and configured

## Apple Requirements That Affect v6

1. Starting 2026-04-28, App Store Connect uploads must be built with Xcode 26 or later and the iOS 26/iPadOS 26 platform SDKs. v6 is not blocked by source code today, but the first iOS store-candidate build must prove the selected EAS image satisfies this before upload.
2. Apple age ratings now use the updated 2026 questionnaire. CyberTrader must answer simulated trading, fictional black-market/crime tone, and game-content questions honestly. If a EULA or policy decision sets a higher minimum age, the App Store Connect rating should be overridden upward instead of relying on the calculated lower rating.
3. App privacy details are required for new apps and updates. v6 must disclose third-party SDK and backend practices, including the launch truth that LocalAuthority is local-only by default and that SupabaseAuthority, if enabled, changes data handling.
4. Apple metadata must accurately reflect the app experience. Screenshots should show the app in use, previews may only use video captures of the app itself, and rights must exist for all screenshot/preview/icon materials.
5. Apple preview video requirements bind Reel/Zoro: previews are 15-30 seconds, up to 30 fps, accepted in `.mov`, `.m4v`, or `.mp4`, and v6 should stage portrait iPhone captures unless Zoro approves a wider device plan.
6. Apple screenshot requirements bind Palette/Zoro: one to ten screenshots are accepted; because v6 sets `supportsTablet: false`, the immediate Apple screenshot plan can focus on iPhone sizes unless that app config changes.
7. Apple third-party SDK requirements make the native dependency report part of Gate B/C. Xcode combines privacy manifests for third-party SDKs, and listed SDKs require manifests/signatures when included. The first native archive should save the privacy report as evidence.
8. Apple App Review payments rules remain relevant even with wallet code disabled: if any future feature unlocks digital content, game currency, or paid functionality, it must route through the approved in-app purchase path unless a specific entitlement and storefront rule applies. The current LocalAuthority demo avoids this by not selling anything and not requiring a wallet.

## Google Play Requirements That Affect v6

1. Google Play requires new apps and app updates to target Android 15 / API level 35 or higher. This is the biggest current Android submission risk.
2. Expo SDK 52's official version table lists Android `compileSdkVersion` 35 and `targetSdkVersion` 34. Therefore, a default SDK 52 Android store build is not enough evidence for Play submission. The team must either:
   - upgrade to an Expo SDK that targets API 35+ by default, or
   - add and verify an explicit native build-property override, then inspect the generated AAB/manifest before submission.
3. Google Play uses Android App Bundles for new app publishing. v6's `store` profile already sets Android `buildType` to `app-bundle`, so the profile shape is aligned, pending target SDK proof and signing credentials.
4. Play App Signing must be configured in Play Console for store release. The upload key and app signing key must stay outside the repo.
5. The Google Play Data Safety form is required for published apps, including testing tracks. Its answers must match the launch authority mode and any enabled Supabase/network telemetry.
6. Google Play requires app content declarations, including target audience and content settings, in addition to content ratings. CyberTrader should not declare a children target audience unless the product direction changes substantially.
7. Google Play content rating is mandatory. CyberTrader needs the IARC questionnaire completed with simulated trading, fictional crime/black-market framing, and any future chance-based mechanics answered conservatively.
8. Google Play preview assets require at least the app icon and short description. The icon must be a 512 x 512 32-bit PNG up to 1024 KB, and the short description has an 80-character limit. Screenshots, feature graphic, and video must avoid misleading ranking, price, or call-to-action copy.

## Expo And EAS Risks

- SDK 52 remains compatible with the current local app checks, but it is no longer a clean Android store-submission baseline because of target SDK 34.
- SDK 52 has New Architecture enabled in this app. Native smoke remains mandatory because web export cannot prove MMKV, gesture, layout, or native bridge behavior.
- The EAS Node pin matches Expo SDK 52's documented minimum Node `20.18.x`, which is good evidence for current SDK alignment.
- EAS Submit can send built binaries to App Store Connect and Google Play, but credentials are required: Apple Developer/App Store Connect access for iOS, and a Google Service Account key plus initial Play Console setup for Android. Those credentials must not be committed.
- For Google Play, API submission normally requires the app to exist in Play Console and the listing/content forms to be configured first. Treat remote submit as blocked until Ghost/Axiom confirm credentials and manual console prerequisites.

## Submission Checklist Updates Made

`docs/release/axiom-p0-002-regression-checklist.md` now includes these hard gates:

- iOS store-candidate build must prove Xcode 26 / iOS 26 SDK compatibility for uploads on or after 2026-04-28.
- Android store-candidate build must prove `targetSdkVersion >= 35`.
- Expo SDK 52 target SDK mismatch is a blocker until upgrade or build-property override evidence exists.
- Apple App Privacy and Google Data Safety answers must be bound to LocalAuthority/SupabaseAuthority launch scope.
- Apple age rating and Google IARC/content declarations must explicitly account for simulated trading and fictional black-market framing.
- Store preview/screenshot specs are linked to the official Apple and Google asset rules.

## Gate Impact

Gate A remains focused on reliable demo quality and is not blocked by this research.

Gate B is blocked until:

- iOS simulator smoke passes.
- Android emulator smoke passes.
- Native cold-launch persistence is validated.
- The first iOS native build path confirms Xcode 26 / iOS 26 SDK readiness for uploads after 2026-04-28.
- The first Android native build path confirms API 35+ target.

Gate C is blocked until:

- Apple App Privacy and Google Data Safety drafts exist.
- Apple age rating and Google IARC/content declarations are drafted.
- Store screenshots, icon/splash, and preview assets are staged with ownership notes.
- LocalAuthority-only versus SupabaseAuthority launch scope is decided and reflected in policy copy.

## Recommended Follow-Ups

- `rune-p0-003`: native cold-launch persistence validation on iOS Simulator and Android Emulator.
- `axiom-p0-001`: Web/iOS/Android smoke execution against the updated checklist.
- `ghost-p0-003`: build-plan approval only after Xcode 26 and Android target SDK 35 proof paths are explicit.
- `ghost-p1-005`: decide LocalAuthority-only launch scope before privacy/data safety forms are finalized.
- `cipher-p0-002`: complete the policy matrix for simulated trading, token naming, wallet flags, privacy, and age rating.
- `kite-p1-004`: ensure `$OBOL`, wallet, and non-custodial copy avoids real-money or investment claims.

## Validation

This is a research and documentation pass. Source verification used official Apple, Google, Android Developers, and Expo documentation available on 2026-04-26.

Required local validation for this pass:

- v6: `npm run typecheck`, `npm test -- --runInBand`, `npx expo export --platform web`
- Dev Lab after planning sync: `cd web && npm run typecheck && npm run build`

# rune-p0-004 - EAS Build Profiles

Date: 2026-04-26
Owner: Rune

## Scope

Added EAS Build profiles for preview install testing, iOS simulator validation, internal store-track candidates, and production store candidates.

## Profiles

| Profile | Purpose | Command |
| --- | --- | --- |
| `preview` | Internal distribution build for QA devices. Android emits an APK for emulator/device install. | `npx eas-cli@latest build --profile preview --platform android` |
| `preview-simulator` | Standalone iOS Simulator build for native smoke testing without TestFlight. | `npx eas-cli@latest build --profile preview-simulator --platform ios` |
| `internal` | Store-signed internal candidate for TestFlight / Play Internal Testing dry runs. | `npx eas-cli@latest build --profile internal --platform ios` and `--platform android` |
| `production` | Store-candidate profile for final App Store / Play Store builds. | `npx eas-cli@latest build --profile production --platform ios` and `--platform android` |

## App Identifiers

- Expo slug: `cybertrader-age-of-pantheon`
- Expo owner: `ghxstxbt`
- EAS project ID: `b024b715-6718-4854-b318-c6afbb8788e6`
- URL scheme: `cybertrader`
- iOS bundle identifier: `ai.cybertrader.app`
- Android package: `ai.cybertrader.app`

## Environment Policy

- EAS profiles commit only non-secret configuration.
- `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=false` keeps the launch path on LocalAuthority until Kite's SupabaseAuthority work is ready.
- Do not commit real Supabase URLs, anon keys, Apple credentials, Google service account files, or signing material.
- When SupabaseAuthority is enabled, configure environment-specific values through EAS environment variables and keep any server-only values secret.

## Validation

- `node -e "JSON.parse(require('fs').readFileSync('eas.json', 'utf8'))"`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npx expo export --platform web`

## Remaining Work

- Confirm `ghxstxbt` account access before the first remote build.
- Configure Apple and Google Play credentials through EAS credentials before store submission.
- Run the first iOS simulator and Android emulator smoke builds under Axiom/Rune QA.

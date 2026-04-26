# rune-p0-004 - EAS Build Profiles

Date: 2026-04-26
Owner: Rune

## Scope

Added EAS Build profiles for preview install testing, iOS simulator validation, internal distribution, and store candidates.

## Profiles

| Profile | Purpose | Command |
| --- | --- | --- |
| `preview` | Internal distribution build for QA devices. Android emits an APK for emulator/device install. | `npx eas-cli@latest build --profile preview --platform android` |
| `preview-simulator` | Standalone iOS Simulator build for native smoke testing without TestFlight. | `npx eas-cli@latest build --profile preview-simulator --platform ios` |
| `internal` | Team/stakeholder internal distribution build. Android emits an installable APK. | `npx eas-cli@latest build --profile internal --platform ios` and `--platform android` |
| `store` | Store-candidate profile for TestFlight / Play Internal Testing builds. | `npx eas-cli@latest build --profile store --platform ios` and `--platform android` |
| `production` | EAS default alias for store-candidate builds. | `npx eas-cli@latest build --profile production --platform ios` and `--platform android` |

## App Identifiers

- Expo slug: `cybertrader-age-of-pantheon`
- Expo project: `@ghxstxbt/cybertrader-age-of-pantheon`
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
- `npx eas-cli config --profile preview --platform ios --non-interactive --json`
- `npx eas-cli config --profile preview --platform android --non-interactive --json`
- `npx eas-cli config --profile preview-simulator --platform ios --non-interactive --json`
- `npx eas-cli config --profile internal --platform ios --non-interactive --json`
- `npx eas-cli config --profile internal --platform android --non-interactive --json`
- `npx eas-cli config --profile store --platform ios --non-interactive --json`
- `npx eas-cli config --profile store --platform android --non-interactive --json`
- `npx eas-cli config --profile production --platform ios --non-interactive --json`
- `npx eas-cli config --profile production --platform android --non-interactive --json`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npx expo export --platform web`

## Remaining Work

- Configure Apple and Google Play credentials through EAS credentials before store submission.
- Run the first iOS simulator and Android emulator smoke builds under Axiom/Rune QA.

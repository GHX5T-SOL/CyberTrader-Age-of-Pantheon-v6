# rune-p0-006 - Expo SDK 54 Package Alignment

Date: 2026-04-29
Owner: Rune
Status: Partial - package graph aligned; native proof pending

## Summary

The v6 JavaScript package graph now matches Expo SDK 54 according to
`npx expo install --check`. This repairs the local Jest preset break uncovered
while validating `oracle-p1-009` and moves the store-toolchain track forward.

Native Gate B/C evidence is still pending because this Codex host does not have
full Xcode, `simctl`, Android Emulator, or `adb`; those store proofs must come
from a provisioned QA/build host.

## Changes

- Upgraded Expo module packages to the SDK 54-compatible set:
  `@expo/metro-runtime`, `expo-av`, `expo-font`, `expo-haptics`,
  `expo-linear-gradient`, `expo-linking`, `expo-router`,
  `expo-splash-screen`, and `expo-status-bar`.
- Aligned core runtime packages with SDK 54: `react` 19.1.0,
  `react-dom` 19.1.0, `react-native` 0.81.5, `react-native-web` 0.21.x,
  `react-native-gesture-handler`, `react-native-reanimated`,
  `react-native-safe-area-context`, `react-native-screens`, and
  `react-native-svg`.
- Added `react-native-worklets`, required by Reanimated 4.
- Aligned test tooling with the runtime: `jest-expo` 54,
  `@types/react` 19, and `react-test-renderer` 19.
- Regenerated `package-lock.json` from the SDK 54-compatible dependency graph.

## Validation

- `npx expo install --check` passed: dependencies are up to date.
- Focused Oracle/Hydra Jest suites passed after the alignment:
  `npm run archetypes:report`, `npm run tuning:beta`,
  `npm run retention:beta`, and `npm run swarm:market`.
- `npm run ship:check` passed after rebasing onto `origin/main`: safety scan,
  typecheck, 157/157 Jest tests in 33 suites, and Expo web export.
- `npm run qa:smoke` passed: 1/1 Chromium route.
- `npx expo export --platform web --clear` passed after clearing the Metro
  bundler cache.
- `npm audit --omit=dev --audit-level=high` returned no high-severity
  production advisories; 14 moderate Expo-toolchain advisories remain and
  `npm audit fix --force` still proposes a breaking Expo downgrade.

## Remaining Gate

- Run iOS simulator and Android emulator smoke tests on a provisioned host.
- Produce native build evidence that proves Xcode 26 / iOS 26 SDK output and
  Android `targetSdkVersion >= 35`.

# AI Council Directive: Master V8

Do not overwrite v6 main. Work from branch `codex/master-v8`.

## Goal

Merge the best of current v6 and dev-lab into a master v8 candidate.

## Priority

1. Preserve latest v6 stability and autonomous-agent fixes.
2. Port dev-lab Intel System into v6.
3. Replace explicit BUY/SELL signals with interpretive news intel.
4. Keep Expo 54 / React 19 runtime from v6.
5. Do not downgrade dependencies.
6. Verify with typecheck, tests, web export, and browser smoke test.

## Must Include

- `NewsEvent` / `currentNews` / `pendingConfirmation` / `lastConfirmation`.
- `HARD INTEL` / `MARKET WHISPER` card.
- `OPEN MARKET` CTA.
- Delayed confirmation card.
- No `ACT ON SIGNAL` or direct `BUY X` / `SELL Y` guidance.
- Preserve v6 QA scripts and latest agent work.

## Do Not

- Blind-copy dev-lab `src` package dependencies.
- Break latest v6 game loop.
- Merge without tests.
- Push directly to main.

## Output Required

- Files changed.
- Verification results.
- What was preserved from v6.
- What was imported from dev-lab.
- Remaining risks.

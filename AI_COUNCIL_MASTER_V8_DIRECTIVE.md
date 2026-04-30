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

## UI Visual Canon

Use this reference image as the visual destination:

`C:\Users\akmha\Downloads\ChatGPT Image Apr 26, 2026, 04_40_46 PM.png`

The target look is a premium cyberpunk mobile trading interface:

- Deep black / blue-black glass background with a neon city silhouette.
- Rounded phone-frame composition for the main dashboard.
- Strong cyan, green, amber, red, and purple semantic glow system.
- Circular energy and heat meters at the top.
- Primary intel / opportunity card is the dominant visual element.
- Large glowing CTA buttons; primary action is green/cyan.
- Secondary cards for confirmations, courier returns, scan lock, trade result, heat increase, streak, and XP.
- Market watch rows use item icons, price, percent movement, and mini sparklines.
- Trading modal uses the right-side card language: commodity icon, current price, owned amount, buy/sell tabs, quantity controls, projected profit, heat impact, risk level, and execute button.
- Bottom nav is mobile-first: Trade / Map / Empire.
- No flat grey prototype panels; all cards need glass depth, glow edge, and clear hierarchy.

Agents must preserve the v8 Intel System language while matching this visual canon. If the reference contains old direct-copy text such as `ACT ON SIGNAL` or `BUY 10`, translate that into the new intel-safe language instead of reintroducing direct trade instructions.

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

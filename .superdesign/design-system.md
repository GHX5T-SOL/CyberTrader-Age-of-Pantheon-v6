# CyberTrader v6 Design System

Generated: 2026-04-26
Scope: Expo Router app in `CyberTrader-Age-of-Pantheon-v6`.

## Product Frame

CyberTrader: Age of Pantheon is a portrait-first mobile trading game presented as a pirated cyberdeck terminal. The active first-session journey is:

1. `/` hydrates and redirects.
2. `/video-intro` and `/intro` establish Pantheon/Eidolon lore.
3. `/login` claims a local handle without wallet requirements.
4. `/boot` runs AG3NT_0S boot text.
5. `/home` opens the deck dashboard and pushes `/tutorial` until complete.
6. `/terminal` hosts the S1LKROAD 4.0 buy/sell loop.

## Visual Language

- Direction: diegetic terminal, CRT scanline overlay, cyberdeck HUD, compact mobile control surface.
- Avoid: generic SaaS dashboard language, marketing-card composition, oversized explanatory copy, decorative gradients that do not feel like terminal light.
- Primary surfaces: dark terminal background, 1 px neon borders, mono type, dense but readable metrics, command labels in brackets.
- Brand signal: `CYBERTRADER: AGE OF PANTHEON`, `AG3NT_0S//pIRAT3`, `S1LKROAD 4.0`, Eidolon identity copy, local demo/no-wallet clarity.

## Current Tokens

Terminal tokens in `theme/terminal.ts`:

- Background `#0B0C10`, panels `#0F0F0F`, `#111115`, `#0D0D0F`.
- Borders `#2A2A2A`, dim borders `#1A1A1A`.
- Text `#C8D6E5`, muted `#8395A7`, dim `#3A3A3A`.
- Accents: cyan `#00F0FF`, cyan dark `#00A0CC`, green `#39FF14`, amber `#FFB800`, red `#FF3131`, system green `#20C20E`.
- Overlays: modal `rgba(0,0,0,0.8)`, status `rgba(10,10,10,0.9)`, scanline `rgba(255,255,255,0.03)`.
- Typeface: `JetBrains Mono` for routed terminal screens.

Legacy first-playable tokens in `theme/colors.ts` still exist for unused `screens/first-playable/*` components. Do not treat these as the current routed surface unless those screens are reactivated.

## Component Patterns

- `TerminalShell`: global status strip, scanlines, vignette, content wrapper.
- `ActionButton`: 52 px full-width command button, uppercase bracket labels, pulsing cyan for primary calls to action.
- `NeonBorder`: 1 px terminal panel with optional cyan glow.
- `MetricChip`: two-column mobile metrics with optional progress bar and two-line value cap.
- `CommodityRow`: 48 px market row with commodity icon, ticker, name, price, and change indicator.
- `BurgerMenu`: full-screen terminal overlay navigation from the home route.
- `Scanlines`: repeated CRT line treatment over dark surfaces.

## Motion And Interaction

- Intro text types one character every 45 ms; skip appears after 4 seconds.
- Boot text appears in sequenced lines, then flashes/static before `/home`.
- Primary buttons pulse rather than using broad decorative animation.
- Trade feedback appears as temporary `tradeJuice`, heat warning borders, haptics on native, and system message copy.
- Android back is owned by route hardening and should never pop to an empty stack.

## First-Session UX Requirements

- The player must understand the identity stakes: they are an illegal Eidolon shard booting through a pirated OS.
- Wallet and real-money expectations must stay off the first flow; LocalAuthority/local demo copy must remain visible.
- The first trade needs an obvious low-risk path: start with `VBLM`, buy a small lot, wait for a tick, sell when green.
- Energy, Heat, 0BOL balance, selected ticker, and owned inventory must remain scannable on small phones.
- Any required copy should be in-world and operational, not explanatory marketing text.

## Vex P0 Mobile HUD Readability Pass

Superdesign project: `CyberTrader v6 HUD readability pass`

- Baseline draft: `b91811ab-de45-4dd5-a27f-cf7bce08671b`.
- Branch references: `6f18c62a-b34a-426e-8c2c-89f091d711c7` and `4034312d-d827-4ca5-8a3d-4fae56a93713`.
- Home HUD keeps the same terminal shell but prioritizes Energy, Heat, and 0BOL before secondary market/rank telemetry.
- `MetricChip`, `CommodityRow`, and `ActionButton` must scale or truncate text explicitly instead of allowing critical labels, prices, or commands to clip.
- Terminal trade controls must remain thumb-sized: segmented BUY/SELL controls are at least 52 px tall, quantity presets are at least 44 px tall, and command buttons keep the 52 px `ActionButton` height.
- Terminal trade screens should surface Energy, Heat, owned quantity, and 0BOL near the ticket so a player does not need to scroll back to understand whether the next action is safe.

## Vex P0 Responsive Viewport Pass

Superdesign project: `CyberTrader v6 responsive viewport pass`

- Baseline draft: `1cfa9101-1369-4cb8-8f42-1e48e45b0d87`.
- The responsive evidence pass checks Web desktop `1440x900`, small phone `375x667`, large phone `430x932`, and tablet portrait `834x1112`.
- `/home` and `/terminal` must remain navigable at each viewport with no horizontal page overflow and visible first-trade controls.
- Web exports must set `html`, `body`, and `#root` to the terminal background `#0B0C10` so short pages never reveal default browser white outside the cyberdeck frame.
- `npm run qa:responsive` exercises the exported web build through Playwright, creates home/terminal captures, checks for horizontal overflow, verifies the first trade navigation path remains reachable, and fails on browser console/page errors.
- Routine reruns write to ignored `test-results/vex-p0-002-responsive-captures/`; release evidence for `vex-p0-002` is committed under `docs/release/vex-p0-002-responsive-captures/` by setting `CYBERTRADER_RESPONSIVE_CAPTURE_DIR`.

## Vex P1 System State Pass

SuperDesign project: `CyberTrader v6 responsive viewport pass`

- State-system draft: `a8801f62-1aae-42ed-8704-a78044beae08`.
- Preview URL: `https://p.superdesign.dev/draft/a8801f62-1aae-42ed-8704-a78044beae08`.
- `SystemStatePanel` is the shared component for `loading`, `empty`, `offline`, and `error` states.
- Loading states should describe local hydration or packet stitching, never generic spinners.
- Empty states should tell the player whether to buy, wait a tick, change surface, or keep trading.
- Offline states should make LocalAuthority/no-wallet mode explicit and should explain route, travel, or market-lock causes without implying a broken app.
- Error states should use player-safe recovery copy; raw exception, backend, SQL, RPC, URL, or secret-like text must not be echoed into `systemMessage`.

## Kite P0 Launch Identity Pass

Release note: `docs/release/kite-p0-002-launch-identity-recovery.md`.

- Launch identity is a local Eidolon handle only; the first playable flow must not ask for wallet, email, payment, Supabase credentials, or external account recovery.
- Login, Settings, and Legal Disclosures use concise operational copy: handle stays on this device, LocalAuthority is active, and Clear Local Data removes local demo state.
- Recovery language must stay direct and store-safe: cross-device recovery is unavailable in LocalAuthority mode unless a future approved online authority is enabled.
- Avoid seed phrase, private-key, cash-out, withdraw, investment, yield, or staking language in player-facing identity/recovery copy.

## Palette P0 Asset Audit

Release note: `docs/release/palette-p0-001-asset-audit.md`.

- Current commodity icons are all `1254 x 1254` and resolution-safe for in-app rows and internal capture staging.
- `assets/ui/eidolon_shard_core.png` is the current identity art for Signal Core and Remotion teaser material.
- `assets/media/intro-cinematic.mp4` is `1920 x 1080`, `15.042s`, and should be treated as a short hook rather than the main portrait preview source.
- `assets/media/silkroad-dashboard-reference.jpg` is legacy first-playable reference art and is not approved for final store screenshots.
- App icon, adaptive icon foreground, and splash source art are missing from `app.json`; these remain Palette follow-up work before store submission.
- The repo currently lacks source/license/provenance metadata for visible image and video assets. Use existing assets for internal QA and capture planning only until Palette attaches ownership notes for final App Store / Play Store use.

## Palette P1 Screenshot Presets

SuperDesign project: `CyberTrader v6 screenshot preset capture`

- Current capture draft: `b11d6241-7779-4b80-bffb-846467843d92`.
- Preview URL: `https://p.superdesign.dev/draft/b11d6241-7779-4b80-bffb-846467843d92`.
- Store capture presets use the current terminal system for `/home`, `/terminal`, `/market`, `/missions`, `/menu/inventory`, and `/menu/profile`.
- `npm run capture:screenshots` builds the Expo web export, serves `dist/`, completes normal local-demo onboarding, and captures 1242 x 2688 PNGs from a 414 x 896 mobile viewport at 3x device scale.
- Generated screenshots must stay free of debug UI, personal data, wallet prompts, placeholder copy, and out-of-brand color treatments before Palette/Zoro review.

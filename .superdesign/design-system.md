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

## Zoro P0 Store Media Direction

Release note: `docs/release/zoro-p0-002-store-media-approval.md`.

- The approved Gate C screenshot direction is the current six-route set: home deck, terminal ready, market overview, mission contacts, inventory, and profile.
- The current captures are `1242 x 2688` portrait PNGs produced by the real app capture flow, not mockups or placeholder images.
- The store-page mood is a portrait cyberdeck game: illegal Eidolon shard, PirateOS, S1LKROAD, Heat, Energy, fictional 0BOL, faction/progression hints, and LocalAuthority/no-wallet safety.
- Reel's 30-second preview story is approved to open with the Eidolon/Pantheon hook, reach real app trading quickly, show `VBLM` buy/wait/sell gameplay, and end on missions/rank/profile identity.
- Do not introduce finance-dashboard styling, device-hand footage, store badges, install CTAs, real-money claims, wallet prompts, investment/yield language, prize claims, or unapproved external media.
- Final preview video, native-device screenshot evidence, public privacy policy URL, age-rating declarations, and account-owner store submissions remain Gate C follow-ups.

## Reel P1 Intro Transmission Polish

Release note: `docs/release/reel-p1-002-intro-transmission-polish.md`.

- `/video-intro` and `/intro` use packet metadata, signal status, thin progress rails, and 52 px skip/enter commands to make the first handoff feel like an intercepted cyberdeck transmission.
- Skip and enter controls should remain bottom-right, bordered with existing cyan/green/amber tokens, and large enough for mobile touch.
- Fallback copy must stay diegetic and safe: describe degraded cinematic links and packet stitching without exposing raw media errors or backend details.
- Intro copy must keep wallet, payment, prize, cash-out, staking, and investment language out of the first-session surface.

## Nyx/Vex P1 Tuned Strategy Guidance

Release note: `docs/release/nyx-p1-002-strategy-guidance.md`.

- SuperDesign project: `CyberTrader v6 Vex cyberdeck polish`.
- Baseline draft: `d0db7f31-3ede-4772-aba3-4fe7dbd55ce2`.
- Preview URL: `https://p.superdesign.dev/draft/d0db7f31-3ede-4772-aba3-4fe7dbd55ce2`.
- The first-session cue is now an Oracle route panel, not a generic instructional card: it uses an in-world header, step code, live-script marker, tuned strategy copy, and the current cyan/amber/green token system.
- Metric chips use a subtle left signal rail and active panel fill while preserving the existing 116 px chip height, 48% two-column layout, progress bars, and small-phone scaling rules.
- Strategy guidance must continue to reflect `oracle-p0-006` tuning: starter VBLM x15, safe-cycle VBLM/MTRX, upgrade PGAS/ORRS/SNPS, contraband FDST/AETH/BLCK only below the Heat stop line.

## Oracle P1 Strategy Guidance Pass

SuperDesign project: `CyberTrader v6 Strategy Guidance Pass`

- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/d04527d4-2764-4fad-991a-dfdc48650d31`.
- Baseline reproduction draft: `d225bdf9-46fc-47f7-81c5-38e628c3d79e`.
- Implemented direction follows the Oracle strategy integration branch: `b82e9ab7-f20a-476f-8f8a-351ab27e5f31`.
- Supplemental Codex automation project: `09f65e9b-27ae-4f49-842a-dbf4947ca041`; drafts `f5fd069a-b0b6-4da2-b018-5b3a2c2ae1fc`, `a4ac5fda-68ad-4cfa-a1a3-21c0ba4bbd26`, and `606a6e96-0aba-4084-85d2-02c9d88828d6`.
- First-session guidance should now make the tuned `VBLM x15` starter route explicit on home and terminal.
- If a first-session player selects a non-`VBLM` ticker, the cue should steer them back to `VBLM` before the first clean sell.
- After first profit, the copy should surface `PGAS` / `ORRS` / `SNPS` as the first upgrade lane and keep contraband gated behind low Heat.
- Mission contact strategy hints should read as operator advice, not generic tutorial text, and must stay store-safe: no real-money, investment, cash-out, or prize language.

## Nyx P1 AgentOS Faction Selection

SuperDesign project: `CyberTrader v6 AgentOS faction unlock`

- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/c7661221-672f-4dc2-8105-5bf1f5af6134`.
- Current-state draft: `4bf074bd-0055-40ac-9c27-cd3dceae2642`.
- AgentOS branch draft: `476f9ac2-d2eb-426f-8491-b7088513c103`.
- `/menu/progression` keeps the compact terminal route structure, then adds a faction alignment matrix below the AgentOS gate instead of opening a separate onboarding flow.
- Faction rows should stay dense and operational: faction name/handle, bound/queued state, gameplay stake, mission bias, reward modifier, and Heat posture.
- The action model uses one full-width bracket command after selecting a queued faction row; disabled states must explicitly show whether AgentOS is locked, already current, or allegiance is locked.
- Copy must stay store-safe and local-mode: no token-gated claims, investment language, cash-out, real-money reward, seed phrase, private-key, staking, or wallet-signing language.

## Nyx P1 AgentOS Faction Design Pass

Release note: `docs/release/nyx-p1-003-agentos-faction-design.md`.

- SuperDesign project: `CyberTrader v6 AgentOS Unlock Preview`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/841b8d96-38bd-4372-a22b-f6452ec3d55e`.
- Current reproduction draft: `b84f6a45-ca2c-4c3c-9e3f-613aa2dbb317`.
- AgentOS readiness branch: `7ec5931e-1283-4235-9256-c1537d024b91`.
- Preview URL: `https://p.superdesign.dev/draft/7ec5931e-1283-4235-9256-c1537d024b91`.
- AgentOS remains a compact terminal progression layer, not a separate marketing page. The `/menu/progression` route should show the current PirateOS state, the deterministic AgentOS gate, faction preview signals, and PantheonOS as a future lock.
- The AgentOS gate is rank 5, first profitable sell complete, and Heat at 70 or lower. Requirements should render as terse `[OK]` / `[--]` terminal checklist rows.
- Faction previews use the existing `NeonBorder` panel, mono type, cyan names, muted gameplay stakes, and a green rail for the bound faction. `nyx-p1-004` adds the commit/reselection control directly inside `/menu/progression`.
- Player-facing faction copy must avoid real-money, investment, prize, cash-out, staking, or external-wallet implications. Factions are gameplay allegiances for missions, reputation, and Heat posture.

## Nyx P1 AgentOS Contract Chains

Release note: `docs/release/nyx-p1-005-agentos-contract-chains.md`.

- SuperDesign project: `CyberTrader v6 AgentOS contract chain`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/bd90dfac-fe63-4647-8c8f-a392be88f23d`.
- Current-state draft: `8ed852ec-6fb9-4b42-9ff0-790a88fb8706`.
- Contract-chain branch: `8132f3d8-d0a0-4323-a99e-d0643137658e`.
- Preview URL: `https://p.superdesign.dev/draft/8132f3d8-d0a0-4323-a99e-d0643137658e`.
- `/missions` now uses compact contract strips that show faction, stage, Heat posture, route consequence, and reputation delta in the existing terminal panel language.
- Contract strips should stay subordinate to the mission title/description and must not add new colors, cards, gradients, icons, or tutorial prose.
- Copy remains fictional and store-safe: faction contracts may affect missions, route risk, Heat pressure, and reputation, but must not imply real-money rewards, investment outcomes, prizes, wallet signing, staking, or external cash-out.

## Nyx/Oracle P1 AgentOS Route Pressure

Release note: `docs/release/nyx-p1-006-agentos-route-pressure.md`.

- SuperDesign project: `CyberTrader v6 AgentOS Route Consequences`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/ec4dca81-d196-4656-9287-5e20e26fcc48`.
- Draft generation was attempted before implementation and blocked by team `insufficient_credits`; implementation stays conservative and follows the existing AgentOS contract-chain strip treatment.
- AgentOS contract strips may now show one extra compact `ROUTE // ...` line for deterministic mission pressure: reward modifier, timer modifier, and success/failure Heat delta.
- This line must remain inside the existing `MissionContractStrip` treatment: 1 px left rail, terminal panel fill, 9 px mono text, existing cyan/amber/dim tokens, no new color family, no icon, and no card nesting.
- Route-pressure copy must stay operational and terse, for example `ROUTE // HOT CARGO // REWARD +11% // TIMER -14% // HEAT +3/+5`.
- Free Splinters and Archivists should read as safer lanes with longer timers and lower Heat on clean runs. Blackwake and Null Crown should read as sharper lanes with higher reward pressure, tighter timers, and stronger Heat consequences.
- Mission pressure remains fictional and store-safe: no wallet, real-money, investment, cash-out, staking, yield, prize, or regulated-market language.

## Oracle P1 Terminal Pressure Flow

Release note: `docs/release/oracle-p1-011-terminal-pressure-flow.md`.

- SuperDesign project: `CyberTrader v6 terminal pressure command flow`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/5644c939-eaa3-4b19-91f1-e3819f1cab59`.
- Current terminal reproduction draft: `3973e1de-23d5-4242-9c8f-431409e153f1`.
- Preview URL: `https://p.superdesign.dev/draft/3973e1de-23d5-4242-9c8f-431409e153f1`.
- The `/terminal` trade ticket may show one compact `PRESSURE WINDOW` strip above BUY/SELL controls when an AgentOS faction is bound. This strip must stay inside the existing `NeonBorder` ticket and use only cyan, green, amber, red, muted, and dim terminal tokens.
- Pressure text should be operational and compact: faction, supported/suppressed ticker, basis-point intensity, reputation tier, remaining ticks, and Heat posture. It must not introduce tutorial prose, generic finance-dashboard framing, or new visual components.
- Limit trigger preview rows should stay inside the existing ticket summary and feed the subordinate persisted limit-order module when LocalAuthority is available.
- Branch iteration was blocked by SuperDesign account credits, so implementation must remain conservative and match the existing terminal/AgentOS patterns.

## Oracle P1 Terminal Limit Orders

Release note: `docs/release/oracle-p1-011-terminal-limit-orders.md`.

- SuperDesign project: `CyberTrader v6 Limit Order Terminal`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/f25000ff-d109-4595-aea3-42f168d27235`.
- Current-state draft: `1c601e82-5619-4a94-8b2b-e84fda0c8869`.
- Implemented branch: `957d664e-0fa9-48c6-ba64-0295a14f98d6`.
- Supplemental Codex project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/d6bdee8a-9d86-4685-9130-3657395e17c2`; current-state draft `b310cfdb-95ac-4bf6-b6bc-1a77d69a770b`; implemented branch `0522b707-41bf-4bf3-82f0-1671758fca49`.
- `/terminal` keeps the market `[ EXECUTE ]` and `[ WAIT MARKET TICK ]` path unchanged, then adds a subordinate `AGENTOS // LIMIT_ORD_MOD` panel for optional limit orders.
- Limit-order controls must remain dense and operational: MARKET/LIMIT mode toggle, trigger price, expiry tick, one arm command, one cancel command, open/recent order rows, and a compact faction-pressure strip.
- Deck section headers and market-tape headers should improve scanability without turning terminal surfaces into separate cards; use existing `terminalColors` only.
- Copy must stay local-mode and store-safe: no investment, guaranteed-profit, cash-out, staking, wallet-signing, prize, or real-money language.

## Reel P1 Intro Handoff Polish

Release note: `docs/release/reel-p1-002-intro-handoff-polish.md`.

- SuperDesign project: `CyberTrader v6 intro handoff polish`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/6b092f02-c0c5-4811-a82f-49790ce8a782`.
- Current-state draft: `ca208657-5fea-45a4-8306-d805c2d9a3c6`.
- Intro polish branch: `11e43d49-f646-4207-ab1b-37b5425d9463`.
- Preview URL: `https://p.superdesign.dev/draft/11e43d49-f646-4207-ab1b-37b5425d9463`.
- `/video-intro` and `/intro` use a shared terminal-packet language: `STREAM_04_PANTHEON`, packet labels, signal state, thin progress rails, and a 52 px bottom-right command.
- The cinematic fallback should read as an intentional degraded-link boot handshake, not a broken media state.
- Lore copy should remain short, store-safe, fictional, and operational: illegal Eidolon shard, Pantheon fracture, pirated cyberdeck, no wallet/real-money/investment/prize claims.

## Vex P1 Cyberdeck Surface Polish

Release note: `docs/release/vex-p1-004-cyberdeck-surface-polish.md`.

- SuperDesign project: `CyberTrader v6 Vex cyberdeck surface polish`.
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/ff8f96b6-5cb5-48aa-9c8e-3d3594aa4ca7`.
- Baseline reproduction draft: `0801c908-335b-4728-bdb7-b11d4f702319`.
- Implemented direction follows the dense command-surface branch: `4f1d97b9-df69-46c8-9a0b-ed9a4332d31f`.
- `/home` and `/terminal` now use packet-style section headers for route telemetry, Oracle runbook, live tape, command rack, order pipe, execution rack, cargo ledger, and signal feed.
- Commodity lists should render as market tape tables by pairing `MarketTapeHeader` with `CommodityRow`; keep exact trade-button labels unchanged for QA and first-session continuity.
- Continue to avoid new colors, gradients, cards, icons, tutorial prose, or marketing copy; cyberdeck polish should reuse terminal tokens, 1 px dividers, bracket labels, and compact operational copy.

## Zoro P1 Tutorial Copy Review

Release note: `docs/release/zoro-p1-004-tutorial-copy-review.md`.

- This pass is copy-only: no SuperDesign visual draft was created because routed layout, spacing, colors, and component structure remain unchanged.
- Tutorial copy should read as cyberdeck operating instructions, not generic onboarding. Keep each step focused on one player action or system rule.
- First-session instructions must preserve the tuned route: enter S1LKROAD, select `VBLM`, buy `x15`, use `WAIT MARKET TICK` until green, then switch to SELL and close the same lot.
- Help and cue copy must keep local-mode/store-safe boundaries explicit: `0BOL` is fictional local game currency, `$OBOL` remains optional/disabled unless explicitly enabled, and no copy may imply real-money rewards, investment outcomes, cash-out, staking, wallet signing, or guaranteed profit.

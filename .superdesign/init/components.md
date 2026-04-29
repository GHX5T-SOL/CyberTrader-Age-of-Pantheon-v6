# SuperDesign Init - Components

Generated: 2026-04-26

## Routed UI Components

- `components/terminal-shell.tsx`: app-level frame. Adds status bar, scanline overlay, vignette, footer OS text, and `terminalColors.background`.
- `components/action-button.tsx`: full-width command button. Variants: `primary`, `amber`, `muted`; optional pulsing glow for primary commands.
- `components/neon-border.tsx`: basic panel primitive. 1 px border, terminal panel fill, optional cyan glow.
- `components/metric-chip.tsx`: compact metric card. Used on `/home` for Energy, Heat, Market Signal, Rank, and 0BOL balance.
- `components/commodity-row.tsx`: market list row with commodity icon, ticker, name, price, percent change, pressed state, and selected left border.
- `components/deck-section-header.tsx`: compact terminal rail for section labels and right-side detail metadata; used on home and terminal to stage dense deck zones without card stacking.
- `components/market-tape-header.tsx`: small fixed-label table header for commodity tape columns; paired with `CommodityRow`.
- `components/burger-menu.tsx`: overlay navigation and hamburger trigger. Current menu includes profile, settings, inventory, missions, progression, rank, rewards, notifications, help, and legal.
- `components/scanlines.tsx`: CRT line overlay used on intro/login and through `TerminalShell`.
- `components/route-recovery-screen.tsx`: route recovery fallback for guarded player routes.
- `components/system-state-panel.tsx`: diegetic loading, empty, offline, and error state panel used by route recovery, login, terminal, settings, and notifications.
- `components/animated-number.tsx`: animated numeric display used for 0BOL and price feedback.
- `components/chart-sparkline.tsx`: terminal chart line for the selected commodity.
- `components/confirm-modal.tsx`: confirmation overlay for trades.
- `components/deck-section-header.tsx`: packet-style terminal section divider for route telemetry, live tape, command racks, order pipes, ledgers, and signal feeds.
- `components/market-tape-header.tsx`: compact table header aligned to `CommodityRow` columns so commodity lists read as a S1LKROAD tape.
- `components/first-session-cue.tsx`: live first-loop guidance panel for home and terminal.
- `components/mission-banner.tsx`: pending/active mission panel and compact `MissionContractStrip`; AgentOS strips show faction, stage, Heat posture, route consequence, reputation delta, and route-pressure summary.
- `components/location-banner.tsx`, `flash-event-banner.tsx`, `daily-challenges-panel.tsx`, `streak-display.tsx`, `away-report.tsx`: home route live-world panels.

## Legacy Or Unrouted Components

- `components/objective-strip.tsx` and `components/tutorial-panel.tsx` contain strong first-loop guidance copy but are not imported by routed `app/home.tsx` or `app/terminal.tsx`.
- `screens/first-playable/*` uses `theme/colors.ts` and richer magenta/violet art direction. These screens are not the active Expo Router first-session path.

## Assets

- Commodity icons live in `assets/commodities/*.png`, are mapped in `components/commodity-row.tsx` and `assets/commodity-art.ts`, and are all `1254 x 1254`.
- `assets/ui/eidolon_shard_core.png` is active identity art for `components/signal-core.tsx` and Remotion teaser material.
- `assets/media/intro-cinematic.mp4` and `app/video-intro.tsx` provide the cinematic entry point; the file is `1920 x 1080`, `15.042s`, and landscape.
- `assets/media/silkroad-dashboard-reference.jpg` is used by legacy first-playable market screen, not the routed terminal, and is not approved for final store screenshots.
- `app.json` currently has no explicit icon, adaptive icon foreground, or splash image path.
- Palette audit note: `docs/release/palette-p0-001-asset-audit.md`. Existing visible assets are resolution-safe for internal staging, but final store screenshots and preview video need source/license/provenance sign-off.

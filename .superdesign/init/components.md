# SuperDesign Init - Components

Generated: 2026-04-26

## Routed UI Components

- `components/terminal-shell.tsx`: app-level frame. Adds status bar, scanline overlay, vignette, footer OS text, and `terminalColors.background`.
- `components/action-button.tsx`: full-width command button. Variants: `primary`, `amber`, `muted`; optional pulsing glow for primary commands.
- `components/neon-border.tsx`: basic panel primitive. 1 px border, terminal panel fill, optional cyan glow.
- `components/metric-chip.tsx`: compact metric card. Used on `/home` for Energy, Heat, Market Signal, Rank, and 0BOL balance.
- `components/commodity-row.tsx`: market list row with commodity icon, ticker, name, price, percent change, pressed state, and selected left border.
- `components/burger-menu.tsx`: overlay navigation and hamburger trigger. Current menu includes profile, settings, inventory, missions, progression, rank, rewards, notifications, help, and legal.
- `components/scanlines.tsx`: CRT line overlay used on intro/login and through `TerminalShell`.
- `components/route-recovery-screen.tsx`: route recovery fallback for guarded player routes.
- `components/animated-number.tsx`: animated numeric display used for 0BOL and price feedback.
- `components/chart-sparkline.tsx`: terminal chart line for the selected commodity.
- `components/confirm-modal.tsx`: confirmation overlay for trades.
- `components/first-session-cue.tsx`: live first-loop guidance panel for home and terminal.
- `components/location-banner.tsx`, `flash-event-banner.tsx`, `mission-banner.tsx`, `daily-challenges-panel.tsx`, `streak-display.tsx`, `away-report.tsx`: home route live-world panels.

## Legacy Or Unrouted Components

- `components/objective-strip.tsx` and `components/tutorial-panel.tsx` contain strong first-loop guidance copy but are not imported by routed `app/home.tsx` or `app/terminal.tsx`.
- `screens/first-playable/*` uses `theme/colors.ts` and richer magenta/violet art direction. These screens are not the active Expo Router first-session path.

## Assets

- Commodity icons live in `assets/commodities/*.png` and are mapped in `components/commodity-row.tsx`.
- `assets/media/intro-cinematic.mp4` and `app/video-intro.tsx` provide the cinematic entry point.
- `assets/media/silkroad-dashboard-reference.jpg` is used by legacy first-playable market screen, not the routed terminal.

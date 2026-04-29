# SuperDesign Init - Pages

Generated: 2026-04-26

## First-Session Dependency Trees

### `/intro`

- `app/intro.tsx`
- `components/scanlines.tsx`
- `hooks/use-demo-bootstrap.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

### `/login`

- `app/login.tsx`
- `components/action-button.tsx`
- `components/ascii-divider.tsx`
- `components/scanlines.tsx`
- `components/system-state-panel.tsx`
- `hooks/use-demo-bootstrap.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

### `/boot`

- `app/boot.tsx`
- `hooks/use-demo-bootstrap.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

### `/home`

- `app/home.tsx`
- `components/terminal-shell.tsx`
- `components/burger-menu.tsx`
- `components/action-button.tsx`
- `components/animated-number.tsx`
- `components/away-report.tsx`
- `components/commodity-row.tsx`
- `components/daily-challenges-panel.tsx`
- `components/deck-section-header.tsx`
- `components/first-session-cue.tsx`
- `components/flash-event-banner.tsx`
- `components/location-banner.tsx`
- `components/market-tape-header.tsx`
- `components/metric-chip.tsx`
- `components/mission-banner.tsx`
- `components/pulsing-dot.tsx`
- `components/route-recovery-screen.tsx`
- `components/streak-display.tsx`
- `data/locations.ts`
- `engine/demo-market.ts`
- `engine/district-state.ts`
- `hooks/use-demo-route-guard.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

### `/tutorial`

- `app/tutorial.tsx`
- `components/action-button.tsx`
- `components/neon-border.tsx`
- `hooks/use-demo-bootstrap.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

### `/terminal`

- `app/terminal.tsx`
- `components/action-button.tsx`
- `components/animated-number.tsx`
- `components/chart-sparkline.tsx`
- `components/commodity-row.tsx`
- `components/confirm-modal.tsx`
- `components/deck-section-header.tsx`
- `components/first-session-cue.tsx`
- `components/market-tape-header.tsx`
- `components/neon-border.tsx`
- `components/route-recovery-screen.tsx`
- `components/system-state-panel.tsx`
- `data/locations.ts`
- `engine/demo-market.ts`
- `engine/district-state.ts`
- `engine/flash-events.ts`
- `hooks/use-demo-route-guard.ts`
- `state/demo-store.ts`
- `theme/terminal.ts`

## First-Session Design Observations

- The current routed first-session path has a strong intro and login identity, and `components/first-session-cue.tsx` now surfaces the first-loop objective in active `/home` and `/terminal` routes.
- `/home` provides many systems at once after tutorial completion. This is rich, but the first trade task can compete with flash events, missions, daily challenges, shipments, travel, and rank panels.
- `/terminal` has the strongest actionable trade loop, especially with selected `VBLM`, price chart, buy/sell tabs, lot size, heat, Energy, manual market tick, and confirmation.
- Error, empty, offline, and loading states now share `SystemStatePanel` so recovery, quiet panels, lockouts, and local-loop disclosures remain in-world and App Store-safe.

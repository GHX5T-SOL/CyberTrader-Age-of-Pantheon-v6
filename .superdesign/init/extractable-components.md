# Extractable Components

Generated: 2026-04-26

## TerminalShell

- Source: `components/terminal-shell.tsx`
- Category: layout
- Description: App-level terminal frame with status strip, scanlines, vignette, and OS footer.
- Extractable props: `showStatusBar` (boolean)
- Hardcoded: AG3NT_0S label, local clock, scanline count, terminal colors.

## ActionButton

- Source: `components/action-button.tsx`
- Category: basic
- Description: Full-width bracket-command button used for primary player actions.
- Extractable props: `label` (string), `variant` (`primary` | `amber` | `muted`), `disabled` (boolean), `glowing` (boolean)
- Hardcoded: 52 px height, uppercase mono label, haptic feedback, terminal palette.

## NeonBorder

- Source: `components/neon-border.tsx`
- Category: basic
- Description: 1 px terminal panel with optional active cyan glow.
- Extractable props: `active` (boolean)
- Hardcoded: panel fill, border width, cyan glow.

## FirstSessionCue

- Source: `components/first-session-cue.tsx`
- Category: gameplay guidance
- Description: Diegetic first-loop cue for enter market, buy starter signal, wait/sell, and post-profit states.
- Extractable props: `surface`, `firstTradeComplete`, `selectedTicker`
- Hardcoded: cue state copy, terminal colors, step number layout.

## OperatorBrief

- Source: `components/operator-brief.tsx`
- Category: gameplay guidance
- Description: Compact retention brief that reduces action fatigue and Heat anxiety with one progress line, a Heat ladder, and one next action.
- Extractable props: `surface`, `firstTradeComplete`, `selectedTicker`, `heat`
- Hardcoded: Hydra retention copy, terminal palette, five-step Heat ladder, action labels.

## SystemStatePanel

- Source: `components/system-state-panel.tsx`
- Category: state
- Description: Diegetic terminal state panel for loading, empty, offline, and error surfaces.
- Extractable props: `kind`, `title`, `message`, `detail`, `actionLabel`, `compact`, `framed`
- Hardcoded: terminal palette, mono type scale, state-to-accent mapping, default App Store-safe state copy.

## MetricChip

- Source: `components/metric-chip.tsx`
- Category: telemetry
- Description: Two-column mobile metric panel with optional progress bar.
- Extractable props: `label`, `value`, `subValue`, `progressValue`, `progressColor`, `icon`, `accentColor`
- Hardcoded: 48 percent width, 116 px minimum height, terminal type scale.

## CommodityRow

- Source: `components/commodity-row.tsx`
- Category: market
- Description: Commodity list row with image icon, ticker, name, price, and percent movement.
- Extractable props: `ticker`, `name`, `price`, `changePercent`, `isSelected`
- Hardcoded: 48 px row height, local commodity icon map, alternating panel fills.

## DeckSectionHeader

- Source: `components/deck-section-header.tsx`
- Category: basic
- Description: Packet-style terminal section divider used to make route telemetry, live tape, command racks, order pipes, ledgers, and signal feeds read as cyberdeck subsystems.
- Extractable props: `label`, `detail`, `accent`
- Hardcoded: terminal palette, 1 px top/bottom borders, mono uppercase treatment.

## MarketTapeHeader

- Source: `components/market-tape-header.tsx`
- Category: market
- Description: Commodity-list column header aligned to `CommodityRow` for a live market tape treatment.
- Extractable props: none
- Hardcoded: ICON/ID/ASSET_NAME/PRICE/DELTA labels and commodity row column widths.

## BurgerMenu

- Source: `components/burger-menu.tsx`
- Category: navigation
- Description: Full-screen terminal navigation overlay and hamburger trigger.
- Extractable props: `visible`
- Hardcoded: current menu item list and route targets.

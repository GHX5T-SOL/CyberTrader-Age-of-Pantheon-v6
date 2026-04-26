# SuperDesign Init - Theme

Generated: 2026-04-26

## Current Terminal Theme

Source: `theme/terminal.ts`.

```text
background: #0B0C10
panel: #0F0F0F
panelAlt: #111115
panelEven: #0D0D0F
border: #2A2A2A
borderDim: #1A1A1A
text: #C8D6E5
muted: #8395A7
dim: #3A3A3A
cyan: #00F0FF
cyanDark: #00A0CC
green: #39FF14
amber: #FFB800
red: #FF3131
systemGreen: #20C20E
terminalFont: JetBrains Mono
```

## Layout Metrics Observed

- Status bar height: 32 px in `TerminalShell`.
- Primary command height: 52 px in `ActionButton`.
- Market row height: 48 px in `CommodityRow`.
- Login handle input height: 44 px.
- Common screen horizontal padding: 12 to 24 px.
- Modal max widths: 320 to 360 px.
- Borders: mostly 1 px; active panels use cyan glow with low opacity.

## Theming Notes

- The active routed UI is mostly cyan/green/amber/red over near-black. Use red only for danger and heat warnings.
- Cyan indicates active commands, selected rows, and deck identity.
- Amber indicates caution, news/signal, travel, and Energy actions.
- Green indicates system success, profitable trade feedback, and boot status.
- Magenta/violet tokens exist in `theme/colors.ts` but are primarily attached to legacy first-playable screens.

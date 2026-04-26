# SuperDesign Init - Layouts

Generated: 2026-04-26

## Root Layout

`app/_layout.tsx` wraps the entire app in:

- `GestureHandlerRootView` with `terminalColors.background`.
- Expo `StatusBar` in light mode.
- `MenuContext.Provider` for hamburger menu open/close.
- `TerminalShell`, then an Expo Router `Stack` with hidden headers and fade animation.
- `BurgerMenu` overlay above the stack.

## TerminalShell Layout

`components/terminal-shell.tsx` defines the persistent cyberdeck frame:

- Absolute 32 px top status strip with `AG3NT_0S//pIRAT3` and local clock.
- Content padded down by 32 px while status bar is visible.
- Footer text `//PIRATE OS v0.1.3`.
- 200 horizontal scanlines plus a linear-gradient vignette and `Scanlines`.

## Screen Layout Patterns

- `/intro`: centered text on dark full-screen background with skip button in lower-right after 4 seconds.
- `/login`: full-height scroll view, centered ASCII logo, status lines, handle input, primary enter button, replay intro link, local demo note.
- `/boot`: full-screen bottom-aligned boot log with static and white flash before route replacement.
- `/tutorial`: modal overlay centered on a max-width 360 px neon panel.
- `/home`: scroll view with absolute burger trigger, location banner, wrapping metric chips, live event panels, first five commodity rows, command buttons, and footer quick links.
- `/terminal`: scroll view with home back row, market lock panels, full commodity list, sparkline, trade ticket, trade feedback, positions, news, and confirm modal.

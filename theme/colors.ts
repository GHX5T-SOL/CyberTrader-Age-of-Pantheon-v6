/**
 * src/theme/colors.ts - app-local palette mirror for Expo bundling.
 *
 * The canonical source remains brand/color/tokens.ts, but Metro cannot yet
 * resolve imports outside src during export, so the first playable slice keeps
 * a synced local copy here.
 */

export const palette = {
  bg: {
    void: "#050608",
    terminal: "#0A0F0D",
    deepGreenBlack: "#07130E",
  },
  fg: {
    primary: "#E8F0EE",
    muted: "#7B8B8A",
  },
  accent: {
    cyan: "#00F5FF",
    acidGreen: "#67FFB5",
  },
  danger: {
    heat: "#FF2A4D",
  },
  warn: {
    amber: "#FFB341",
  },
  lore: {
    violet: "#7A5BFF",
  },
} as const;

export type PaletteToken =
  | `bg.${keyof typeof palette.bg}`
  | `fg.${keyof typeof palette.fg}`
  | `accent.${keyof typeof palette.accent}`
  | `danger.${keyof typeof palette.danger}`
  | `warn.${keyof typeof palette.warn}`
  | `lore.${keyof typeof palette.lore}`;

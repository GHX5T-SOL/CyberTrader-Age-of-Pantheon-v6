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
    card: "#080A14",
    elevated: "#0D1022",
    glass: "#11152A",
  },
  fg: {
    primary: "#E8F0EE",
    muted: "#7B8B8A",
    dim: "#46505D",
  },
  accent: {
    cyan: "#00F5FF",
    acidGreen: "#67FFB5",
    magenta: "#FF2BD6",
    violet: "#8A36FF",
    blue: "#388BFF",
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
  alpha: {
    clear: "transparent",
    black50: "rgba(0,0,0,0.5)",
    black70: "rgba(0,0,0,0.7)",
    cyan10: "rgba(0,245,255,0.1)",
    cyan18: "rgba(0,245,255,0.18)",
    cyan35: "rgba(0,245,255,0.35)",
    magenta10: "rgba(255,43,214,0.1)",
    magenta18: "rgba(255,43,214,0.18)",
    magenta35: "rgba(255,43,214,0.35)",
    violet20: "rgba(138,54,255,0.2)",
    white06: "rgba(232,240,238,0.06)",
    white10: "rgba(232,240,238,0.1)",
    white16: "rgba(232,240,238,0.16)",
  },
} as const;

export type PaletteToken =
  | `bg.${keyof typeof palette.bg}`
  | `fg.${keyof typeof palette.fg}`
  | `accent.${keyof typeof palette.accent}`
  | `danger.${keyof typeof palette.danger}`
  | `warn.${keyof typeof palette.warn}`
  | `lore.${keyof typeof palette.lore}`;

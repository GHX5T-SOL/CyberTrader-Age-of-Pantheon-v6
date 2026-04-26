import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export type SystemStateKind = "loading" | "empty" | "offline" | "error";

export interface SystemStateCopy {
  eyebrow: string;
  title: string;
  message: string;
  detail?: string;
}

interface SystemStatePanelProps extends Partial<SystemStateCopy> {
  kind: SystemStateKind;
  actionLabel?: string;
  compact?: boolean;
  framed?: boolean;
  onAction?: () => void;
  style?: ViewStyle;
}

const DEFAULT_COPY: Record<SystemStateKind, SystemStateCopy> = {
  loading: {
    eyebrow: "DECK SYNC",
    title: "STITCHING SESSION VECTOR",
    message: "Decrypting local packets. Keep the shard awake.",
    detail: "DATA_STREAM ACTIVE",
  },
  empty: {
    eyebrow: "QUIET GRID",
    title: "NO SIGNALS ON THIS LAYER",
    message: "Nothing is missing. The deck has no live payload for this panel yet.",
    detail: "WAIT TICK OR CHANGE SURFACE",
  },
  offline: {
    eyebrow: "LOCAL LOOP",
    title: "UPLINK SEALED",
    message: "The run continues on this device. Wallet and live authority links are not required.",
    detail: "LOCALAUTHORITY ACTIVE",
  },
  error: {
    eyebrow: "RECOVERY NODE",
    title: "ACTION REJECTED SAFELY",
    message: "The deck blocked the move before it could damage the session.",
    detail: "RETRY FROM A STABLE NODE",
  },
};

const ACCENT_BY_KIND: Record<SystemStateKind, string> = {
  loading: terminalColors.cyan,
  empty: terminalColors.muted,
  offline: terminalColors.amber,
  error: terminalColors.red,
};

const FILL_BY_KIND: Record<SystemStateKind, string> = {
  loading: terminalColors.cyanFill,
  empty: terminalColors.panelAlt,
  offline: "rgba(255,184,0,0.08)",
  error: "rgba(255,49,49,0.08)",
};

export function getSystemStateCopy(
  kind: SystemStateKind,
  overrides: Partial<SystemStateCopy> = {},
): SystemStateCopy {
  const copy: SystemStateCopy = { ...DEFAULT_COPY[kind] };

  for (const key of Object.keys(overrides) as (keyof SystemStateCopy)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      copy[key] = value;
    }
  }

  return copy;
}

export function getSystemStateAccent(kind: SystemStateKind): string {
  return ACCENT_BY_KIND[kind];
}

export default function SystemStatePanel({
  kind,
  eyebrow,
  title,
  message,
  detail,
  actionLabel,
  compact = false,
  framed = true,
  onAction,
  style,
}: SystemStatePanelProps) {
  const copy = getSystemStateCopy(kind, { eyebrow, title, message, detail });
  const accent = getSystemStateAccent(kind);
  const showAction = Boolean(actionLabel && onAction);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLiveRegion={kind === "loading" ? "polite" : "none"}
      style={[
        {
          borderWidth: framed ? 1 : 0,
          borderColor: accent,
          backgroundColor: framed ? FILL_BY_KIND[kind] : "transparent",
          padding: compact ? 10 : 14,
          gap: compact ? 8 : 10,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: compact ? 28 : 34,
            height: compact ? 28 : 34,
            borderWidth: 1,
            borderColor: accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {kind === "loading" ? (
            <ActivityIndicator color={accent} size="small" />
          ) : (
            <Text
              style={{
                fontFamily: terminalFont,
                color: accent,
                fontSize: compact ? 10 : 11,
                fontWeight: "700",
              }}
            >
              {kind === "empty" ? "--" : kind === "offline" ? "//" : "!!"}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{
              fontFamily: terminalFont,
              color: terminalColors.muted,
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              marginTop: 3,
              fontFamily: terminalFont,
              color: accent,
              fontSize: compact ? 11 : 13,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {copy.title}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontFamily: terminalFont,
          color: terminalColors.text,
          fontSize: compact ? 10 : 11,
          lineHeight: compact ? 16 : 18,
        }}
      >
        {copy.message}
      </Text>

      {copy.detail ? (
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={{
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 9,
            textTransform: "uppercase",
          }}
        >
          {copy.detail}
        </Text>
      ) : null}

      {showAction ? (
        <Pressable
          hitSlop={6}
          onPress={onAction}
          style={({ pressed }) => ({
            minHeight: 44,
            borderWidth: 1,
            borderColor: pressed ? terminalColors.text : accent,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 10,
            backgroundColor: pressed ? terminalColors.panelAlt : terminalColors.background,
          })}
        >
          {({ pressed }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{
                fontFamily: terminalFont,
                color: pressed ? terminalColors.text : accent,
                fontSize: 11,
                fontWeight: "700",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {actionLabel}
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

export { SystemStatePanel };

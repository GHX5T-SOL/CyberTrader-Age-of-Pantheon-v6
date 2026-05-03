import { Text, View, type ViewStyle } from "react-native";
import type { OsProgressionState, OsTierProgression } from "@/engine/os-progression";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface OsStatusMatrixProps {
  state: OsProgressionState;
  compact?: boolean;
  style?: ViewStyle;
}

function statusColor(status: OsTierProgression["status"]): string {
  if (status === "active" || status === "ready") {
    return terminalColors.cyan;
  }
  if (status === "complete") {
    return terminalColors.green;
  }
  return terminalColors.dim;
}

function statusLabel(status: OsTierProgression["status"]): string {
  if (status === "active") {
    return "LIVE";
  }
  if (status === "ready") {
    return "READY";
  }
  if (status === "complete") {
    return "COMPLETE";
  }
  return "LOCKED";
}

function OsTierCard({ tier, compact }: { tier: OsTierProgression; compact: boolean }) {
  const accent = statusColor(tier.status);
  const visibleRequirements = tier.requirements.filter((requirement) => !requirement.met).slice(0, 2);

  return (
    <View
      style={{
        flex: 1,
        minWidth: compact ? 94 : 104,
        borderWidth: 1,
        borderLeftWidth: tier.status === "active" || tier.status === "ready" ? 2 : 1,
        borderColor: tier.status === "locked" ? terminalColors.borderDim : accent,
        borderLeftColor: accent,
        backgroundColor: tier.status === "active" ? terminalColors.cyanFill : terminalColors.panel,
        padding: compact ? 8 : 10,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={{ flex: 1, fontFamily: terminalFont, color: terminalColors.text, fontSize: compact ? 10 : 11, fontWeight: "700" }}
        >
          {tier.name}
        </Text>
        <Text style={{ fontFamily: terminalFont, color: accent, fontSize: 8 }}>
          {statusLabel(tier.status)}
        </Text>
      </View>
      <View style={{ height: 5, backgroundColor: terminalColors.borderDim }}>
        <View style={{ height: 5, width: `${tier.progressPercent}%`, backgroundColor: accent }} />
      </View>
      <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
        RANK {tier.rankRequired} // {tier.progressPercent}%
      </Text>
      {!compact ? (
        <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 9, lineHeight: 13 }}>
          {tier.capabilities.slice(0, 2).join(" / ")}
        </Text>
      ) : null}
      {!compact && visibleRequirements.length ? (
        <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 9, lineHeight: 13 }}>
          NEXT // {visibleRequirements.map((requirement) => requirement.label.toUpperCase()).join(" // ")}
        </Text>
      ) : null}
    </View>
  );
}

export default function OsStatusMatrix({ state, compact = false, style }: OsStatusMatrixProps) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: terminalColors.borderDim,
          backgroundColor: terminalColors.panelEven,
          padding: compact ? 10 : 12,
          gap: 10,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, letterSpacing: 1 }}>
            OS_STACK // {state.activeTier}
          </Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.74}
            style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: compact ? 11 : 12, lineHeight: compact ? 15 : 17 }}
          >
            {state.nextAction}
          </Text>
        </View>
        <View style={{ minWidth: 62, alignItems: "flex-end" }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 9 }}>SHARD</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 13, fontWeight: "700" }}>
            {state.pantheonReadiness.shardSignal}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {state.tiers.map((tier) => (
          <OsTierCard key={tier.id} tier={tier} compact={compact} />
        ))}
      </View>
    </View>
  );
}

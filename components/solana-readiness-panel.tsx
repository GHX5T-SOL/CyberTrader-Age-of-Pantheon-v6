import { Platform, Text, View, type ViewStyle } from "react-native";
import { getObolReadiness, type SolanaRuntimePlatform } from "@/solana/obol-readiness";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface SolanaReadinessPanelProps {
  walletAddress?: string | null;
  style?: ViewStyle;
}

function getRuntimePlatform(): SolanaRuntimePlatform {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return Platform.OS;
  }

  return "web";
}

function toneForStatus(status: string): string {
  if (status === "ready") {
    return terminalColors.green;
  }
  if (status === "limited") {
    return terminalColors.amber;
  }
  if (status === "blocked") {
    return terminalColors.red;
  }
  return terminalColors.dim;
}

function ReadinessRow({ label, value, color = terminalColors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
      <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{ flex: 1, fontFamily: terminalFont, color, fontSize: 10, textAlign: "right" }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SolanaReadinessPanel({ walletAddress, style }: SolanaReadinessPanelProps) {
  const readiness = getObolReadiness({
    platform: getRuntimePlatform(),
    walletAddress,
  });
  const statusColor = toneForStatus(readiness.status);

  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: statusColor,
          backgroundColor: terminalColors.panel,
          padding: 12,
          gap: 8,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
            SOLANA // $OBOL READINESS
          </Text>
          <Text style={{ marginTop: 5, fontFamily: terminalFont, color: statusColor, fontSize: 11, lineHeight: 16 }}>
            {readiness.primaryCopy}
          </Text>
        </View>
        <Text style={{ fontFamily: terminalFont, color: statusColor, fontSize: 10 }}>
          {readiness.status.toUpperCase()}
        </Text>
      </View>
      <View style={{ gap: 5 }}>
        <ReadinessRow label="AUTHORITY" value={readiness.authorityMode.replace("_", " ").toUpperCase()} color={statusColor} />
        <ReadinessRow label="WALLET MODE" value={readiness.walletMode.replaceAll("_", " ").toUpperCase()} />
        <ReadinessRow label="CLUSTER" value={readiness.cluster.toUpperCase()} />
        <ReadinessRow label="MINT" value={readiness.mintConfigured ? "CONFIGURED" : "NOT CONFIGURED"} color={readiness.mintConfigured ? terminalColors.green : terminalColors.amber} />
        <ReadinessRow label="READ BALANCE" value={readiness.canReadBalance ? "READY" : "LOCKED"} />
        <ReadinessRow label="TRANSFER INTENT" value={readiness.canCreateTransferIntent ? "ANDROID MWA READY" : "LOCKED"} />
      </View>
      <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 10, lineHeight: 15 }}>
        {readiness.detailCopy}
      </Text>
    </View>
  );
}

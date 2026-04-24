import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { MetricRing } from "@/components/metric-ring";
import { MobileGameShell } from "@/components/mobile-game-shell";
import { PositionsPanel } from "@/components/positions-panel";
import { PrimaryAction } from "@/components/primary-action";
import { formatObol } from "@/engine/demo-market";
import { useDemoMarketLoop } from "@/hooks/use-demo-market-loop";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function TerminalHomeScreen() {
  const router = useRouter();
  const handle = useDemoStore((state) => state.handle);
  const profile = useDemoStore((state) => state.profile);
  const tick = useDemoStore((state) => state.tick);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const resources = useDemoStore((state) => state.resources);
  const positions = useDemoStore((state) => state.positions);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const lastRealizedPnl = useDemoStore((state) => state.lastRealizedPnl);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const isBusy = useDemoStore((state) => state.isBusy);
  const openMarket = useDemoStore((state) => state.openMarket);
  const purchaseEnergyHour = useDemoStore((state) => state.purchaseEnergyHour);
  const resetDemo = useDemoStore((state) => state.resetDemo);

  useDemoMarketLoop();

  const energyHours = Math.floor(resources.energySeconds / 3600);
  const heatPercent = Math.min(100, resources.heat);

  return (
    <MobileGameShell
      eyebrow="cybertrader: age of pantheon"
      title="AG3NT_0S//PIRAT3"
      right={<SkullBadge />}
    >
      <Stack.Screen options={{ title: "Dashboard" }} />
      <View style={{ gap: 6 }}>
        <Text selectable style={styles.idLine}>
          EIDOLON: {handle || "UNCLAIMED"} // {profile?.id.slice(0, 4) ?? "7X9"}...A3F
        </Text>
        <Text selectable style={styles.statusLine}>
          {systemMessage}
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-around", gap: 16 }}>
          <MetricRing label="Energy" value={energyHours} suffix="h" max={72} tone="cyan" />
          <MetricRing label="Heat" value={heatPercent} suffix="%" max={100} tone="magenta" />
        </View>
        <View style={styles.signalCard}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text selectable style={styles.cardEyebrow}>
              priority signal
            </Text>
            <Text selectable style={styles.cardTitle}>
              Neon Plaza Demand Spike
            </Text>
            <Text selectable style={styles.cardBody}>
              Velvet Tabs and Ghost Chips are moving. Keep Heat low and close the
              first loop clean.
            </Text>
          </View>
          <Text selectable style={styles.signalGlyph}>
            ~/\~
          </Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text selectable style={styles.sectionHeader}>
          Command Dashboard
        </Text>
        <HubTile
          number="01"
          title="Game"
          body="Enter S1LKROAD 4.0 and run the playable trade loop."
          accent="magenta"
          onPress={() => {
            openMarket();
            router.push("/market");
          }}
        />
        <HubTile
          number="02"
          title="Tutorials"
          body="How to play: buy a low-risk commodity, wait for ticks, then sell for profit."
          accent="cyan"
        />
        <HubTile
          number="03"
          title="Settings"
          body="Local demo mode. Wallet, audio, and accessibility settings will land next."
          accent="violet"
        />
      </View>

      <View style={styles.walletCard}>
        <Text selectable style={styles.cardEyebrow}>
          ledger
        </Text>
        <Text selectable style={styles.balanceText}>
          {formatObol(balanceObol)} 0BOL
        </Text>
        <Text selectable style={styles.cardBody}>
          Tick {String(tick).padStart(4, "0")} // OS {profile?.osTier ?? "PIRATE"} //
          {firstTradeComplete ? " first trade survived" : " first trade pending"}
        </Text>
        {lastRealizedPnl !== null ? (
          <Text
            selectable
            style={{
              color: lastRealizedPnl >= 0 ? palette.accent.cyan : palette.danger.heat,
              fontFamily: monoFamily,
            }}
          >
            LAST PNL {lastRealizedPnl >= 0 ? "+" : ""}
            {lastRealizedPnl.toFixed(2)} 0BOL
          </Text>
        ) : null}
      </View>

      <PositionsPanel positions={positions} />
      <PrimaryAction
        label="buy 1h energy"
        tone="cyan"
        disabled={isBusy}
        onPress={() => {
          void purchaseEnergyHour();
        }}
      />
      <PrimaryAction
        label="replay intro / reset demo"
        tone="heat"
        disabled={isBusy}
        onPress={() => {
          void resetDemo().then(() => {
            router.replace("/boot");
          });
        }}
      />
    </MobileGameShell>
  );
}

function SkullBadge() {
  return (
    <View style={styles.skullBadge}>
      <Text selectable style={{ color: palette.accent.magenta, fontSize: 24 }}>
        {String.fromCharCode(9760)}
      </Text>
    </View>
  );
}

function HubTile({
  number,
  title,
  body,
  accent,
  onPress,
}: {
  number: string;
  title: string;
  body: string;
  accent: "cyan" | "magenta" | "violet";
  onPress?: () => void;
}) {
  const color =
    accent === "magenta"
      ? palette.accent.magenta
      : accent === "violet"
        ? palette.accent.violet
        : palette.accent.cyan;

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: color,
        borderRadius: 22,
        borderCurve: "continuous",
        backgroundColor: palette.bg.card,
        padding: 16,
        flexDirection: "row",
        gap: 14,
      }}
    >
      <Text selectable style={{ color, fontFamily: monoFamily, fontSize: 24, opacity: 0.8 }}>
        {number}.
      </Text>
      <View style={{ flex: 1, gap: 5 }}>
        <Text selectable style={styles.tileTitle}>
          {title}
        </Text>
        <Text selectable style={styles.cardBody}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = {
  idLine: {
    color: palette.fg.primary,
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: monoFamily,
  },
  statusLine: {
    color: palette.fg.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  heroCard: {
    gap: 18,
    borderWidth: 1,
    borderColor: palette.alpha.cyan35,
    borderRadius: 30,
    borderCurve: "continuous" as const,
    backgroundColor: palette.bg.elevated,
    padding: 18,
  },
  signalCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.alpha.magenta35,
    borderRadius: 20,
    borderCurve: "continuous" as const,
    backgroundColor: palette.alpha.magenta10,
    padding: 14,
  },
  cardEyebrow: {
    color: palette.accent.cyan,
    fontSize: 10,
    letterSpacing: 1.7,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  cardTitle: {
    color: palette.fg.primary,
    fontSize: 18,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  cardBody: {
    color: palette.fg.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  signalGlyph: {
    color: palette.accent.magenta,
    fontSize: 30,
    fontFamily: monoFamily,
  },
  sectionHeader: {
    color: palette.accent.cyan,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  walletCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: palette.alpha.white16,
    borderRadius: 22,
    borderCurve: "continuous" as const,
    backgroundColor: palette.bg.card,
    padding: 16,
  },
  balanceText: {
    color: palette.fg.primary,
    fontSize: 24,
    fontWeight: "900" as const,
    fontFamily: monoFamily,
  },
  skullBadge: {
    width: 54,
    height: 54,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: palette.accent.magenta,
    borderRadius: 18,
    backgroundColor: palette.alpha.magenta10,
  },
  tileTitle: {
    color: palette.fg.primary,
    fontSize: 17,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
};

import { Stack, useRouter } from "expo-router";
import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { commodityArt } from "@/assets/commodity-art";
import { MetricRing } from "@/components/metric-ring";
import { MobileGameShell } from "@/components/mobile-game-shell";
import { NewsFeed } from "@/components/news-feed";
import { PositionsPanel } from "@/components/positions-panel";
import { PriceSparkline } from "@/components/price-sparkline";
import { PrimaryAction } from "@/components/primary-action";
import { DEMO_COMMODITIES, formatDelta, formatObol } from "@/engine/demo-market";
import type { Commodity } from "@/engine/types";
import { useDemoMarketLoop } from "@/hooks/use-demo-market-loop";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const conceptBackdrop = require("../../assets/media/silkroad-dashboard-reference.jpg");
const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function MarketScreen() {
  const router = useRouter();
  const handle = useDemoStore((state) => state.handle);
  const tick = useDemoStore((state) => state.tick);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const resources = useDemoStore((state) => state.resources);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const priceHistory = useDemoStore((state) => state.priceHistory);
  const positions = useDemoStore((state) => state.positions);
  const activeNews = useDemoStore((state) => state.activeNews);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const isBusy = useDemoStore((state) => state.isBusy);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const goHome = useDemoStore((state) => state.goHome);

  useDemoMarketLoop();

  const selectedCommodity =
    DEMO_COMMODITIES.find((commodity) => commodity.ticker === selectedTicker) ??
    DEMO_COMMODITIES[0];
  if (!selectedCommodity) {
    return null;
  }
  const selectedPrice = prices[selectedTicker] ?? selectedCommodity.basePrice;
  const selectedChange = changes[selectedTicker] ?? 0;
  const selectedPosition = positions[selectedTicker];
  const energyHours = Math.floor(resources.energySeconds / 3600);

  return (
    <MobileGameShell
      eyebrow="ag3nt_0s//pirat3"
      title="S1LKROAD 4.0"
      right={
        <Pressable
          onPress={() => {
            goHome();
            router.replace("/terminal");
          }}
          style={styles.menuButton}
        >
          <Text selectable style={styles.menuText}>
            DASH
          </Text>
        </Pressable>
      }
    >
      <Stack.Screen options={{ title: "S1LKROAD" }} />
      <Text selectable style={styles.idLine}>
        EIDOLON: {handle || "ZORO"} // LIVE MARKET // TICK {String(tick).padStart(4, "0")}
      </Text>

      <ImageBackground
        source={conceptBackdrop}
        resizeMode="cover"
        style={styles.cityCard}
        imageStyle={{ opacity: 0.45 }}
      >
        <View style={styles.cityOverlay} />
        <View style={{ flexDirection: "row", justifyContent: "space-around", gap: 16 }}>
          <MetricRing label="Energy" value={energyHours} suffix="h" max={72} tone="cyan" />
          <MetricRing label="Heat" value={Math.min(100, resources.heat)} suffix="%" tone="magenta" />
        </View>
      </ImageBackground>

      <View style={styles.signalCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text selectable style={styles.cardEyebrow}>
            active signal
          </Text>
          <Text selectable style={styles.cardTitle}>
            {selectedCommodity.name}
          </Text>
          <Text selectable style={styles.cardBody}>
            {systemMessage}
          </Text>
        </View>
        <PriceSparkline values={priceHistory[selectedTicker] ?? [selectedPrice]} tone="magenta" />
      </View>

      <View style={styles.ledgerStrip}>
        <Text selectable style={styles.ledgerLabel}>
          WALLET
        </Text>
        <Text selectable style={styles.ledgerValue}>
          {formatObol(balanceObol)} 0BOL
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <View style={styles.sectionHeaderRow}>
          <Text selectable style={styles.sectionHeader}>
            S1LKROAD 4.0
          </Text>
          <Text selectable style={styles.liveText}>
            LIVE MARKETS
          </Text>
        </View>
        {DEMO_COMMODITIES.slice(0, 5).map((commodity) => (
          <MarketRow
            key={commodity.ticker}
            commodity={commodity}
            price={prices[commodity.ticker] ?? commodity.basePrice}
            change={changes[commodity.ticker] ?? 0}
            selected={commodity.ticker === selectedTicker}
            ownedQuantity={positions[commodity.ticker]?.quantity}
            history={priceHistory[commodity.ticker]}
            onPress={() => {
              selectTicker(commodity.ticker);
            }}
          />
        ))}
      </View>

      <View style={styles.tradePanel}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable style={styles.cardEyebrow}>
              selected asset
            </Text>
            <Text selectable style={styles.tradeTitle}>
              {selectedCommodity.name}
            </Text>
            <Text selectable style={styles.cardBody}>
              Held: {selectedPosition?.quantity ?? 0} // Avg:{" "}
              {selectedPosition?.avgEntry.toFixed(2) ?? "--"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text selectable style={styles.priceText}>
              ${selectedPrice.toFixed(2)}
            </Text>
            <Text
              selectable
              style={{
                color: selectedChange >= 0 ? palette.accent.cyan : palette.danger.heat,
                fontFamily: monoFamily,
              }}
            >
              {formatDelta(selectedChange)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PrimaryAction
            label="buy"
            tone="magenta"
            compact
            disabled={isBusy}
            onPress={() => {
              void buySelected();
            }}
          />
          <PrimaryAction
            label="sell"
            tone="cyan"
            compact
            disabled={isBusy || !selectedPosition}
            onPress={() => {
              void sellSelected().then(() => {
                router.replace("/terminal");
              });
            }}
          />
        </View>
      </View>

      <NewsFeed news={activeNews} />
      <PositionsPanel positions={positions} />
    </MobileGameShell>
  );
}

function MarketRow({
  commodity,
  price,
  change,
  selected,
  ownedQuantity,
  history,
  onPress,
}: {
  commodity: Commodity;
  price: number;
  change: number;
  selected: boolean;
  ownedQuantity?: number;
  history?: number[];
  onPress: () => void;
}) {
  const art = commodityArt[commodity.ticker];
  const changeColor = change >= 0 ? palette.accent.cyan : palette.danger.heat;

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? palette.accent.magenta : palette.alpha.white10,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: selected ? palette.alpha.magenta10 : palette.bg.card,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={styles.assetIcon}>
        {art ? <Image source={art} resizeMode="contain" style={{ width: 34, height: 34 }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable style={styles.assetName}>
          {commodity.name}
        </Text>
        <PriceSparkline values={history ?? [price]} tone={change >= 0 ? "cyan" : "heat"} compact />
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text selectable style={styles.rowPrice}>
          ${price.toFixed(2)}
        </Text>
        <Text selectable style={{ color: changeColor, fontSize: 12, fontFamily: monoFamily }}>
          {formatDelta(change)}
        </Text>
        {ownedQuantity ? (
          <Text selectable style={styles.ownedText}>
            HELD {ownedQuantity}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = {
  idLine: {
    color: palette.fg.muted,
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: monoFamily,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: palette.alpha.cyan35,
    borderRadius: 14,
    backgroundColor: palette.bg.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuText: {
    color: palette.accent.cyan,
    fontSize: 11,
    fontFamily: monoFamily,
    letterSpacing: 1.4,
  },
  cityCard: {
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: palette.alpha.cyan35,
    borderRadius: 26,
    borderCurve: "continuous" as const,
    backgroundColor: palette.bg.elevated,
    paddingVertical: 22,
  },
  cityOverlay: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.alpha.black50,
  },
  signalCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.alpha.magenta35,
    borderRadius: 22,
    borderCurve: "continuous" as const,
    backgroundColor: palette.bg.card,
    padding: 16,
  },
  cardEyebrow: {
    color: palette.accent.cyan,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  cardTitle: {
    color: palette.accent.magenta,
    fontSize: 18,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  cardBody: {
    color: palette.fg.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  ledgerStrip: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: palette.alpha.white10,
    borderRadius: 18,
    backgroundColor: palette.bg.card,
    padding: 14,
  },
  ledgerLabel: {
    color: palette.fg.muted,
    fontSize: 11,
    letterSpacing: 1.8,
    fontFamily: monoFamily,
  },
  ledgerValue: {
    color: palette.fg.primary,
    fontSize: 17,
    fontWeight: "900" as const,
    fontFamily: monoFamily,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sectionHeader: {
    color: palette.accent.cyan,
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  liveText: {
    color: palette.fg.muted,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  assetIcon: {
    width: 46,
    height: 46,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: palette.alpha.cyan35,
    borderRadius: 15,
    backgroundColor: palette.bg.elevated,
  },
  assetName: {
    color: palette.fg.primary,
    fontSize: 13,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  rowPrice: {
    color: palette.fg.primary,
    fontSize: 15,
    fontWeight: "800" as const,
    fontFamily: monoFamily,
  },
  ownedText: {
    color: palette.accent.magenta,
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: monoFamily,
  },
  tradePanel: {
    gap: 14,
    borderWidth: 1,
    borderColor: palette.accent.magenta,
    borderRadius: 24,
    borderCurve: "continuous" as const,
    backgroundColor: palette.alpha.magenta10,
    padding: 16,
  },
  tradeTitle: {
    color: palette.fg.primary,
    fontSize: 19,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
    fontFamily: monoFamily,
  },
  priceText: {
    color: palette.fg.primary,
    fontSize: 22,
    fontWeight: "900" as const,
    fontFamily: monoFamily,
  },
};

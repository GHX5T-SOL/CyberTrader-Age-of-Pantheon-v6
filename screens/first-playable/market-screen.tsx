import { Stack, useRouter } from "expo-router";
import { Text, View, useWindowDimensions } from "react-native";
import { CommodityRow } from "@/components/commodity-row";
import { DemoPhaseShell } from "@/components/demo-phase-shell";
import { NewsFeed } from "@/components/news-feed";
import { PositionsPanel } from "@/components/positions-panel";
import { PrimaryAction } from "@/components/primary-action";
import { ResourceChip } from "@/components/resource-chip";
import { SectionCard } from "@/components/section-card";
import { TutorialPanel } from "@/components/tutorial-panel";
import { TradeTicket } from "@/components/trade-ticket";
import { DEMO_COMMODITIES, formatObol } from "@/engine/demo-market";
import { useDemoMarketLoop } from "@/hooks/use-demo-market-loop";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

export function MarketScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const tick = useDemoStore((state) => state.tick);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const resources = useDemoStore((state) => state.resources);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const priceHistory = useDemoStore((state) => state.priceHistory);
  const positions = useDemoStore((state) => state.positions);
  const activeNews = useDemoStore((state) => state.activeNews);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const isBusy = useDemoStore((state) => state.isBusy);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const goHome = useDemoStore((state) => state.goHome);

  useDemoMarketLoop();

  const selectedCommodity = DEMO_COMMODITIES.find(
    (commodity) => commodity.ticker === selectedTicker,
  );
  const selectedPosition = positions[selectedTicker];
  const selectedPrice = prices[selectedTicker];

  return (
    <DemoPhaseShell
      eyebrow="cybertrader // market scan"
      title="S1LKROAD_4.0"
      description="Read the live terminal tape, choose a ticker, and run one clean buy and sell cycle."
    >
      <Stack.Screen options={{ title: "Market" }} />
      <SectionCard eyebrow={`tick_${String(tick).padStart(4, "0")}`} title="market state" tone="cyan">
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          {systemMessage}
        </Text>
        <View
          style={{
            flexDirection: compact ? "column" : "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <ResourceChip label="0BOL" value={formatObol(balanceObol)} tone="cyan" />
          <ResourceChip
            label="Energy"
            value={`${Math.floor(resources.energySeconds / 3600)}h`}
            tone="acid"
          />
          <ResourceChip label="Heat" value={`${resources.heat}`} tone="heat" />
          <ResourceChip label="Tick" value={String(tick).padStart(4, "0")} tone="amber" />
        </View>
      </SectionCard>
      <TutorialPanel
        phase="market"
        positions={positions}
        firstTradeComplete={firstTradeComplete}
        selectedTicker={selectedTicker}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryAction
          label="terminal home"
          tone="cyan"
          compact
          disabled={isBusy}
          onPress={() => {
            goHome();
            router.replace("/terminal");
          }}
        />
      </View>
      <NewsFeed news={activeNews} />
      <SectionCard eyebrow="s1lkroad_4.0" title="market scan" tone="cyan">
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          Ticker first. Name second. Read the delta. Small trades keep Heat under
          control.
        </Text>
        <View style={{ gap: 10 }}>
          {DEMO_COMMODITIES.map((commodity) => (
            <CommodityRow
              key={commodity.ticker}
              commodity={commodity}
              price={prices[commodity.ticker] ?? commodity.basePrice}
              change={changes[commodity.ticker] ?? 0}
              ownedQuantity={positions[commodity.ticker]?.quantity}
              selected={commodity.ticker === selectedTicker}
              compact={compact}
              onPress={() => {
                selectTicker(commodity.ticker);
              }}
            />
          ))}
        </View>
      </SectionCard>
      <TradeTicket
        commodity={selectedCommodity}
        price={selectedPrice}
        holding={selectedPosition}
        canSell={Boolean(selectedPosition) && !isBusy}
        priceHistory={priceHistory[selectedTicker]}
        onBuy={() => {
          void buySelected();
        }}
        onSell={() => {
          void sellSelected().then(() => {
            router.replace("/terminal");
          });
        }}
      />
      <PositionsPanel positions={positions} />
    </DemoPhaseShell>
  );
}

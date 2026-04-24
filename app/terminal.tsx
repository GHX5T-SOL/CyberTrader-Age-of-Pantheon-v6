import * as React from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ActionButton from "@/components/action-button";
import ChartSparkline from "@/components/chart-sparkline";
import CommodityRow from "@/components/commodity-row";
import ConfirmModal from "@/components/confirm-modal";
import NeonBorder from "@/components/neon-border";
import { getLocation } from "@/data/locations";
import { getActiveDistrictState, isDistrictTradingBlocked } from "@/engine/district-state";
import { DEMO_COMMODITIES, getTradeEnergyCost, getValueBasedTradeHeatDelta, roundCurrency } from "@/engine/demo-market";
import { isTradingBlockedByFlash } from "@/engine/flash-events";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

function pct(change: number, price: number) {
  return price ? (change / Math.max(1, price - change)) * 100 : 0;
}

export default function TerminalRoute() {
  useDemoBootstrap();
  const params = useLocalSearchParams<{ ticker?: string }>();
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const priceHistory = useDemoStore((state) => state.priceHistory);
  const balance = useDemoStore((state) => state.balanceObol);
  const positions = useDemoStore((state) => state.positions);
  const activeNews = useDemoStore((state) => state.activeNews);
  const world = useDemoStore((state) => state.world);
  const clock = useDemoStore((state) => state.clock);
  const activeFlashEvent = useDemoStore((state) => state.activeFlashEvent);
  const districtStates = useDemoStore((state) => state.districtStates);
  const tradeJuice = useDemoStore((state) => state.tradeJuice);
  const orderSize = useDemoStore((state) => state.orderSize);
  const setOrderSize = useDemoStore((state) => state.setOrderSize);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const goHome = useDemoStore((state) => state.goHome);
  const isBusy = useDemoStore((state) => state.isBusy);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const [side, setSide] = React.useState<"BUY" | "SELL">("BUY");
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [positionsOpen, setPositionsOpen] = React.useState(true);
  const [flash, setFlash] = React.useState<"success" | "failure" | null>(null);

  React.useEffect(() => {
    if (params.ticker) {
      selectTicker(String(params.ticker));
    }
  }, [params.ticker, selectTicker]);

  const commodity = (DEMO_COMMODITIES.find((item) => item.ticker === selectedTicker) ?? DEMO_COMMODITIES[0])!;
  const price = prices[commodity.ticker] ?? commodity.basePrice;
  const position = positions[commodity.ticker];
  const maxBuy = Math.max(1, Math.floor(balance / price));
  const maxSell = position?.quantity ?? 0;
  const maxQty = side === "BUY" ? maxBuy : Math.max(1, maxSell);
  const cost = roundCurrency(price * orderSize);
  const heatDelta = getValueBasedTradeHeatDelta(commodity.ticker, cost);
  const energyCost = getTradeEnergyCost(side, orderSize);
  const currentLocation = getLocation(world.currentLocationId);
  const travelling = Boolean(world.travelDestinationId && world.travelEndTime && world.travelEndTime > clock.nowMs);
  const destination = getLocation(world.travelDestinationId);
  const district = getActiveDistrictState(districtStates, world.currentLocationId, clock.nowMs);
  const districtBlocked = isDistrictTradingBlocked(district.state);
  const flashBlocked = isTradingBlockedByFlash(activeFlashEvent, world.currentLocationId);
  const tradeBlocked = travelling || districtBlocked || flashBlocked;
  const remainingMs = world.travelEndTime ? Math.max(0, world.travelEndTime - clock.nowMs) : 0;
  const etaMinutes = Math.floor(remainingMs / 60_000);
  const etaSeconds = Math.floor((remainingMs % 60_000) / 1000);

  React.useEffect(() => {
    if (!tradeJuice || clock.nowMs - tradeJuice.createdAt > 2500) {
      return;
    }
    if (Platform.OS === "web") {
      return;
    }

    const type = tradeJuice.kind === "profit"
      ? Haptics.NotificationFeedbackType.Success
      : tradeJuice.kind === "loss"
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Warning;
    void Haptics.notificationAsync(type);
  }, [clock.nowMs, tradeJuice]);

  const execute = async () => {
    setConfirmVisible(false);
    if (side === "BUY") {
      await buySelected();
    } else {
      await sellSelected();
    }
    setFlash("success");
    setTimeout(() => setFlash(null), 700);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, backgroundColor: terminalColors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Pressable
          onPress={() => {
            goHome();
            router.replace("/home");
          }}
          style={{ paddingVertical: 8, paddingRight: 16 }}
        >
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{"\u2190"} HOME</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.systemGreen, fontSize: 16 }}>S1LKROAD 4.0</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>NODE: {currentLocation.name.toUpperCase()}</Text>
        </View>
      </View>

      {travelling ? (
        <NeonBorder style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>
            TRAVELLING TO {destination.name.toUpperCase()}... ETA {etaMinutes}m {etaSeconds}s
          </Text>
          <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
            TRADING LOCKED UNTIL ARRIVAL
          </Text>
        </NeonBorder>
      ) : null}

      {districtBlocked || flashBlocked ? (
        <NeonBorder style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>
            MARKET LOCKED // {flashBlocked ? "DISTRICT BLACKOUT" : district.state}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
            TRAVEL AWAY OR WAIT FOR STATE CLEARANCE
          </Text>
        </NeonBorder>
      ) : null}

      <NeonBorder active style={{ padding: 0 }}>
        {DEMO_COMMODITIES.map((item, index) => {
          const itemPrice = prices[item.ticker] ?? item.basePrice;
          return (
            <CommodityRow
              key={item.ticker}
              ticker={item.ticker}
              name={item.name}
              price={itemPrice}
              changePercent={pct(changes[item.ticker] ?? 0, itemPrice)}
              index={index}
              isSelected={item.ticker === commodity.ticker}
              onPress={() => selectTicker(item.ticker)}
            />
          );
        })}
      </NeonBorder>

      <View style={{ marginTop: 16 }}>
        <ChartSparkline data={priceHistory[commodity.ticker] ?? [price]} averageEntry={position?.avgEntry} />
      </View>

      <NeonBorder
        active
        style={{
          marginTop: 16,
          borderColor: tradeJuice && clock.nowMs - tradeJuice.createdAt < 1500
            ? tradeJuice.kind === "profit"
              ? terminalColors.green
              : tradeJuice.kind === "loss"
                ? terminalColors.red
                : terminalColors.amber
            : undefined,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["BUY", "SELL"] as const).map((ticketSide) => (
            <Pressable
              key={ticketSide}
              onPress={() => setSide(ticketSide)}
              style={{ flex: 1, borderWidth: 1, borderColor: side === ticketSide ? terminalColors.cyan : terminalColors.borderDim, padding: 10 }}
            >
              <Text style={{ fontFamily: terminalFont, color: side === ticketSide ? terminalColors.cyan : terminalColors.muted, textAlign: "center", fontSize: 12 }}>
                {ticketSide} [{commodity.ticker}]
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ marginTop: 16, fontFamily: terminalFont, color: terminalColors.text, fontSize: 30 }}>{price.toFixed(2)} 0BOL</Text>
        <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>QUANTITY</Text>
        <TextInput
          value={String(orderSize)}
          onChangeText={(value) => setOrderSize(Number(value.replace(/[^0-9]/g, "")) || 1)}
          keyboardType="number-pad"
          style={{ height: 44, borderWidth: 1, borderColor: terminalColors.border, color: terminalColors.text, fontFamily: terminalFont, paddingHorizontal: 12, marginTop: 6 }}
        />
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          {[0.25, 0.5, 0.75, 1].map((portion) => (
            <Pressable key={portion} onPress={() => setOrderSize(Math.max(1, Math.floor(maxQty * portion)))} style={{ flex: 1, borderWidth: 1, borderColor: terminalColors.borderDim, padding: 8 }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11, textAlign: "center" }}>{Math.round(portion * 100)}%</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 14, gap: 4 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>EST COST: {cost.toFixed(2)} 0BOL</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 11 }}>HEAT DELTA: +{heatDelta}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.systemGreen, fontSize: 11 }}>ENERGY COST: {energyCost}s</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <ActionButton
            variant="primary"
            glowing
            label="[ EXECUTE ]"
            disabled={tradeBlocked || isBusy || (side === "SELL" && maxSell <= 0)}
            onPress={() => setConfirmVisible(true)}
          />
        </View>
      </NeonBorder>

      {tradeJuice && clock.nowMs - tradeJuice.createdAt < 2500 ? (
        <Text
          style={{
            marginTop: 10,
            fontFamily: terminalFont,
            color: tradeJuice.kind === "profit" ? terminalColors.green : tradeJuice.kind === "loss" ? terminalColors.red : terminalColors.amber,
            fontSize: tradeJuice.bigWin ? 18 : 12,
            textAlign: "center",
          }}
        >
          {tradeJuice.bigWin ? "BIG WIN // " : ""}
          {tradeJuice.kind.toUpperCase()} {tradeJuice.pnl >= 0 ? "+" : ""}{tradeJuice.pnl.toFixed(2)} 0BOL
        </Text>
      ) : null}

      {flash ? (
        <Text style={{ marginTop: 10, fontFamily: terminalFont, color: flash === "success" ? terminalColors.green : terminalColors.red, fontSize: 11, textAlign: "center" }}>
          {flash === "success" ? "TRADE ACKNOWLEDGED" : "TRADE REJECTED"}
        </Text>
      ) : null}
      <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>{systemMessage}</Text>

      <NeonBorder style={{ marginTop: 16 }}>
        <Pressable onPress={() => setPositionsOpen((value) => !value)} style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>OPEN POSITIONS</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{positionsOpen ? "v" : ">"}</Text>
        </Pressable>
        {positionsOpen ? (
          Object.values(positions).length ? (
            Object.values(positions).map((held) => {
              const current = prices[held.ticker] ?? held.avgEntry;
              const pnl = roundCurrency((current - held.avgEntry) * held.quantity + held.realizedPnl);
              return (
                <Pressable
                  key={held.id}
                  onPress={() => {
                    selectTicker(held.ticker);
                    setSide("SELL");
                    setOrderSize(held.quantity);
                  }}
                  style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}
                >
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                    {held.ticker} QTY {held.quantity} AVG {held.avgEntry.toFixed(2)} NOW {current.toFixed(2)} PNL {pnl.toFixed(2)}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>NO OPEN POSITIONS</Text>
          )
        ) : null}
      </NeonBorder>

      <NeonBorder style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>NEWS FEED</Text>
        {(activeNews.length
          ? activeNews.slice(0, 5)
          : [{ id: "quiet", headline: "NO SIGNALS. MARKET HUM IS CLEAN.", affectedTickers: [], credibility: 1, priceMultiplier: 1, tickPublished: 0, tickExpires: 0 }]
        ).map((news) => (
          <View key={news.id} style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>{news.headline}</Text>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
              {news.affectedTickers.join(" ")} // CRED {Math.round(news.credibility * 100)}%
            </Text>
          </View>
        ))}
      </NeonBorder>

      <ConfirmModal
        visible={confirmVisible}
        message={`${side} ${orderSize} ${commodity.ticker} @ ${price.toFixed(2)} 0BOL?`}
        onConfirm={execute}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

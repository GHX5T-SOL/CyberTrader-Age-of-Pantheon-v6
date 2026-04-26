import * as React from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { BackHandler, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ActionButton from "@/components/action-button";
import AnimatedNumber from "@/components/animated-number";
import ChartSparkline from "@/components/chart-sparkline";
import CommodityRow from "@/components/commodity-row";
import ConfirmModal from "@/components/confirm-modal";
import { FirstSessionCue } from "@/components/first-session-cue";
import NeonBorder from "@/components/neon-border";
import RouteRecoveryScreen from "@/components/route-recovery-screen";
import SystemStatePanel from "@/components/system-state-panel";
import { getLocation } from "@/data/locations";
import { getActiveDistrictState, isDistrictBuyRestricted, isDistrictSellRestricted } from "@/engine/district-state";
import { DEMO_COMMODITIES, getTradeEnergyCost, getValueBasedTradeHeatDelta, roundCurrency } from "@/engine/demo-market";
import { isTradingBlockedByFlash } from "@/engine/flash-events";
import { useDemoRouteGuard } from "@/hooks/use-demo-route-guard";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

function pct(change: number, price: number) {
  return price ? (change / Math.max(1, price - change)) * 100 : 0;
}

function compactNumber(value: number) {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 100_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${Math.round(value)}`;
}

function TerminalTelemetryChip({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <View
      style={{
        width: "48%",
        minHeight: 54,
        borderWidth: 1,
        borderColor: accentColor,
        backgroundColor: terminalColors.panel,
        padding: 9,
        justifyContent: "space-between",
      }}
    >
      <Text numberOfLines={1} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ marginTop: 4, fontFamily: terminalFont, color: accentColor, fontSize: 15, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

function TicketSummaryRow({
  label,
  value,
  color = terminalColors.text,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>{label}</Text>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72} style={{ flex: 1, fontFamily: terminalFont, color, fontSize: 11, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

export default function TerminalRoute() {
  const routeReady = useDemoRouteGuard();
  const params = useLocalSearchParams<{ ticker?: string }>();
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const priceHistory = useDemoStore((state) => state.priceHistory);
  const balance = useDemoStore((state) => state.balanceObol);
  const positions = useDemoStore((state) => state.positions);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const activeNews = useDemoStore((state) => state.activeNews);
  const world = useDemoStore((state) => state.world);
  const clock = useDemoStore((state) => state.clock);
  const activeFlashEvent = useDemoStore((state) => state.activeFlashEvent);
  const districtStates = useDemoStore((state) => state.districtStates);
  const tradeJuice = useDemoStore((state) => state.tradeJuice);
  const resources = useDemoStore((state) => state.resources);
  const heatWarning = useDemoStore((state) => state.heatWarning);
  const orderSize = useDemoStore((state) => state.orderSize);
  const setOrderSize = useDemoStore((state) => state.setOrderSize);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const advanceMarket = useDemoStore((state) => state.advanceMarket);
  const goHome = useDemoStore((state) => state.goHome);
  const isBusy = useDemoStore((state) => state.isBusy);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const [side, setSide] = React.useState<"BUY" | "SELL">("BUY");
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [positionsOpen, setPositionsOpen] = React.useState(true);
  const [flash, setFlash] = React.useState<"success" | "failure" | null>(null);

  React.useEffect(() => {
    if (!routeReady || Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      goHome();
      router.replace("/home");
      return true;
    });

    return () => subscription.remove();
  }, [goHome, routeReady]);

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
  const districtBlocked = side === "BUY" ? isDistrictBuyRestricted(district.state) : isDistrictSellRestricted(district.state);
  const flashBlocked = isTradingBlockedByFlash(activeFlashEvent, world.currentLocationId);
  const tradeBlocked = travelling || districtBlocked || flashBlocked;
  const remainingMs = world.travelEndTime ? Math.max(0, world.travelEndTime - clock.nowMs) : 0;
  const etaMinutes = Math.floor(remainingMs / 60_000);
  const etaSeconds = Math.floor((remainingMs % 60_000) / 1000);
  const energyHours = Math.floor(resources.energySeconds / 3600);
  const energyTone = energyHours > 24 ? terminalColors.green : energyHours >= 6 ? terminalColors.amber : terminalColors.red;
  const heatTone = resources.heat < 30 ? terminalColors.green : resources.heat < 70 ? terminalColors.amber : terminalColors.red;
  const ownedQuantity = position?.quantity ?? 0;

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

  React.useEffect(() => {
    if (!heatWarning || clock.nowMs - heatWarning.createdAt > 2500 || Platform.OS === "web") {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [clock.nowMs, heatWarning]);

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

  if (!routeReady) {
    return <RouteRecoveryScreen title="RECOVERING TERMINAL ROUTE" />;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, backgroundColor: terminalColors.background }}>
      {resources.heat >= 90 ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: terminalColors.red, opacity: 0.35, zIndex: 5 }} />
      ) : null}
      {heatWarning && clock.nowMs - heatWarning.createdAt < 1800 ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: terminalColors.red, zIndex: 6 }} />
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Pressable
          hitSlop={6}
          onPress={() => {
            goHome();
            router.replace("/home");
          }}
          style={{ minHeight: 44, paddingRight: 16, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{"\u2190"} HOME</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: terminalColors.systemGreen, fontSize: 16 }}>S1LKROAD 4.0</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>NODE: {currentLocation.name.toUpperCase()}</Text>
        </View>
      </View>

      {travelling ? (
        <SystemStatePanel
          kind="offline"
          title="MARKET LINK IN TRANSIT"
          message={`S1LKROAD packets are parked until arrival at ${destination.name}.`}
          detail={`ETA ${etaMinutes}m ${etaSeconds}s // TRADING LOCKED`}
          compact
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {districtBlocked || flashBlocked ? (
        <SystemStatePanel
          kind="offline"
          title={`MARKET LOCKED // ${flashBlocked ? "DISTRICT BLACKOUT" : district.state}`}
          message="This channel is sealed before the order reaches the tape."
          detail="TRAVEL AWAY OR WAIT FOR STATE CLEARANCE"
          compact
          style={{ marginBottom: 12, borderColor: terminalColors.red }}
        />
      ) : null}

      <View style={{ marginBottom: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <TerminalTelemetryChip label="ENERGY" value={`${energyHours}h`} accentColor={energyTone} />
        <TerminalTelemetryChip label="HEAT" value={`${resources.heat}%`} accentColor={heatTone} />
        <TerminalTelemetryChip label={`OWNED ${commodity.ticker}`} value={compactNumber(ownedQuantity)} accentColor={ownedQuantity > 0 ? terminalColors.green : terminalColors.muted} />
        <TerminalTelemetryChip label="0BOL" value={compactNumber(balance)} accentColor={terminalColors.cyan} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <FirstSessionCue
          surface="terminal"
          positions={positions}
          firstTradeComplete={firstTradeComplete}
          selectedTicker={commodity.ticker}
        />
      </View>

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
              hitSlop={4}
              onPress={() => setSide(ticketSide)}
              style={{
                flex: 1,
                minHeight: 52,
                borderWidth: 1,
                borderColor: side === ticketSide ? terminalColors.cyan : terminalColors.borderDim,
                backgroundColor: side === ticketSide ? terminalColors.cyanFill : terminalColors.background,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: side === ticketSide ? terminalColors.cyan : terminalColors.muted, textAlign: "center", fontSize: 13, fontWeight: "700" }}>
                {ticketSide} [{commodity.ticker}]
              </Text>
            </Pressable>
          ))}
        </View>
        <AnimatedNumber
          value={price}
          formatter={(value) => `${value.toFixed(2)} 0BOL`}
          style={{ marginTop: 16, fontFamily: terminalFont, color: terminalColors.text, fontSize: 30 }}
        />
        <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>QUANTITY</Text>
        <TextInput
          value={String(orderSize)}
          onChangeText={(value) => setOrderSize(Number(value.replace(/[^0-9]/g, "")) || 1)}
          keyboardType="number-pad"
          selectTextOnFocus
          style={{ height: 48, borderWidth: 1, borderColor: terminalColors.border, color: terminalColors.text, fontFamily: terminalFont, fontSize: 18, paddingHorizontal: 12, marginTop: 6 }}
        />
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          {[0.25, 0.5, 0.75, 1].map((portion) => (
            <Pressable
              key={portion}
              hitSlop={4}
              onPress={() => setOrderSize(Math.max(1, Math.floor(maxQty * portion)))}
              style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: portion === 1 ? terminalColors.cyan : terminalColors.borderDim, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: portion === 1 ? terminalColors.cyan : terminalColors.muted, fontSize: 11, textAlign: "center" }}>
                {portion === 1 ? "MAX" : `${Math.round(portion * 100)}%`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 14, gap: 4 }}>
          <TicketSummaryRow label="EST COST" value={`${cost.toFixed(2)} 0BOL`} />
          <TicketSummaryRow label="HEAT DELTA" value={`+${heatDelta}`} color={terminalColors.amber} />
          <TicketSummaryRow label="ENERGY COST" value={`${energyCost}s`} color={terminalColors.systemGreen} />
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
        <View style={{ marginTop: 10 }}>
          <ActionButton
            variant="amber"
            label="[ WAIT MARKET TICK ]"
            disabled={isBusy}
            onPress={() => {
              void advanceMarket();
            }}
          />
        </View>
      </NeonBorder>

      {tradeJuice && clock.nowMs - tradeJuice.createdAt < 2500 ? (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: terminalFont,
              color: tradeJuice.kind === "profit" ? terminalColors.green : tradeJuice.kind === "loss" ? terminalColors.red : terminalColors.amber,
              fontSize: tradeJuice.bigWin ? 18 : 12,
              textAlign: "center",
            }}
          >
            {tradeJuice.bigWin ? "BIG WIN // " : ""}
            {tradeJuice.kind.toUpperCase()}
          </Text>
          <AnimatedNumber
            value={tradeJuice.pnl}
            formatter={(value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)} 0BOL`}
            style={{
              marginTop: 3,
              fontFamily: terminalFont,
              color: tradeJuice.kind === "profit" ? terminalColors.green : tradeJuice.kind === "loss" ? terminalColors.red : terminalColors.amber,
              fontSize: tradeJuice.bigWin ? 18 : 12,
              textAlign: "center",
            }}
          />
        </View>
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
            <SystemStatePanel
              kind="empty"
              framed={false}
              compact
              title="NO OPEN POSITIONS"
              message="Buy one starter lot, wait for green tape, then sell to close the first loop."
              detail="SELECT VBLM IF YOU WANT THE LOW-RISK PATH"
              style={{ marginTop: 10 }}
            />
          )
        ) : null}
      </NeonBorder>

      <NeonBorder style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>NEWS FEED</Text>
        {activeNews.length ? (
          activeNews.slice(0, 5).map((news) => (
            <View key={news.id} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>{news.headline}</Text>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {news.affectedTickers.join(" ")} // CRED {Math.round(news.credibility * 100)}%
              </Text>
            </View>
          ))
        ) : (
          <SystemStatePanel
            kind="empty"
            framed={false}
            compact
            title="NO CLEAN RUMORS"
            message="The tape is moving on raw flow. Wait a market tick for new signals."
            detail="DATA_STREAM QUIET"
            style={{ marginTop: 10 }}
          />
        )}
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

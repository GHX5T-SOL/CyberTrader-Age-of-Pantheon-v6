import * as React from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { BackHandler, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ActionButton from "@/components/action-button";
import AnimatedNumber from "@/components/animated-number";
import ChartSparkline from "@/components/chart-sparkline";
import CommodityRow from "@/components/commodity-row";
import ConfirmModal from "@/components/confirm-modal";
import DeckSectionHeader from "@/components/deck-section-header";
import { FirstSessionCue } from "@/components/first-session-cue";
import MarketTapeHeader from "@/components/market-tape-header";
import NeonBorder from "@/components/neon-border";
import { OperatorBrief, type OperatorBriefAction } from "@/components/operator-brief";
import RouteRecoveryScreen from "@/components/route-recovery-screen";
import SystemStatePanel from "@/components/system-state-panel";
import { getLocation } from "@/data/locations";
import { getActiveDistrictState, isDistrictBuyRestricted, isDistrictSellRestricted } from "@/engine/district-state";
import {
  DEFAULT_TRADE_QUANTITY,
  DEMO_COMMODITIES,
  FIRST_TRADE_HINT_TICKER,
  getTradeEnergyCost,
  getValueBasedTradeHeatDelta,
  roundCurrency,
} from "@/engine/demo-market";
import { isTradingBlockedByFlash } from "@/engine/flash-events";
import { buildTerminalPressureCommand, type TerminalPressureCommand } from "@/engine/terminal-pressure";
import type { LimitOrder, LimitOrderSide } from "@/engine/types";
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

function TerminalPressureStrip({ command }: { command: TerminalPressureCommand | null }) {
  if (!command) {
    return (
      <View style={{ marginBottom: 12, borderWidth: 1, borderColor: terminalColors.borderDim, backgroundColor: terminalColors.panelEven, padding: 10 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 10, letterSpacing: 1 }}>AGENTOS PRESSURE // NOT BOUND</Text>
        <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
          Bind a rank-5 faction to unlock deterministic pressure windows and limit-trigger previews.
        </Text>
      </View>
    );
  }

  const riskColor = command.riskTone === "hot" ? terminalColors.red : command.riskTone === "watch" ? terminalColors.amber : terminalColors.green;
  const pressureColor = command.direction === "support" ? terminalColors.green : terminalColors.amber;

  return (
    <View
      style={{
        marginBottom: 12,
        borderWidth: 1,
        borderColor: command.selectedTickerAffected ? terminalColors.cyan : terminalColors.borderDim,
        backgroundColor: terminalColors.panelEven,
        padding: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ flex: 1, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 10, letterSpacing: 1 }}>
          PRESSURE WINDOW // {command.factionName.toUpperCase()}
        </Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
          {command.ticksRemaining}T
        </Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ marginTop: 6, fontFamily: terminalFont, color: pressureColor, fontSize: 11 }}>
        {command.pressureLabel} // {command.standingTier.toUpperCase()} REP {command.reputation}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
        {command.pressureDetail}
      </Text>
      <Text style={{ marginTop: 5, fontFamily: terminalFont, color: riskColor, fontSize: 10 }}>
        HEAT POSTURE +{command.heatDelta} // EXPIRES TICK {command.expiresAtTick}
      </Text>
    </View>
  );
}

function LimitOrderStatusRow({
  order,
  onCancel,
}: {
  order: LimitOrder;
  onCancel?: () => void;
}) {
  const statusColor = order.status === "open"
    ? terminalColors.cyan
    : order.status === "filled"
      ? terminalColors.green
      : order.status === "cancelled" || order.status === "expired"
        ? terminalColors.amber
        : terminalColors.red;

  return (
    <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{ flex: 1, fontFamily: terminalFont, color: statusColor, fontSize: 10, fontWeight: "700" }}
        >
          {order.status.toUpperCase()} // {order.side} {order.quantity} {order.ticker} @ {order.limitPrice.toFixed(2)}
        </Text>
        {order.status === "open" && onCancel ? (
          <Pressable
            hitSlop={4}
            onPress={onCancel}
            style={{
              minHeight: 44,
              borderWidth: 1,
              borderColor: terminalColors.red,
              paddingHorizontal: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 9 }}>[ CANCEL ]</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
        EXPIRES T+{order.expiresAtTick} {order.faction ? `// ${order.faction.replace("_", " ")}` : "// LOCAL"}
      </Text>
    </View>
  );
}

export default function TerminalRoute() {
  const routeReady = useDemoRouteGuard();
  const params = useLocalSearchParams<{ ticker?: string }>();
  const profile = useDemoStore((state) => state.profile);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const tick = useDemoStore((state) => state.tick);
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
  const npcReputation = useDemoStore((state) => state.npcReputation);
  const tradeJuice = useDemoStore((state) => state.tradeJuice);
  const resources = useDemoStore((state) => state.resources);
  const heatWarning = useDemoStore((state) => state.heatWarning);
  const orderSize = useDemoStore((state) => state.orderSize);
  const setOrderSize = useDemoStore((state) => state.setOrderSize);
  const limitOrders = useDemoStore((state) => state.limitOrders);
  const lastLimitOrderFill = useDemoStore((state) => state.lastLimitOrderFill);
  const placeLimitOrder = useDemoStore((state) => state.placeLimitOrder);
  const cancelLimitOrder = useDemoStore((state) => state.cancelLimitOrder);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const advanceMarket = useDemoStore((state) => state.advanceMarket);
  const goHome = useDemoStore((state) => state.goHome);
  const isBusy = useDemoStore((state) => state.isBusy);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const [side, setSide] = React.useState<"BUY" | "SELL">("BUY");
  const [orderMode, setOrderMode] = React.useState<"MARKET" | "LIMIT">("MARKET");
  const [limitPriceText, setLimitPriceText] = React.useState("");
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
  const pressureCommand = buildTerminalPressureCommand({
    faction: profile?.faction ?? null,
    npcReputation,
    selectedTicker: commodity.ticker,
    side,
    price,
    orderSize,
    tick,
    heat: resources.heat,
  });
  const defaultLimitPrice = pressureCommand?.limitPrice ?? roundCurrency(price * (side === "BUY" ? 0.98 : 1.02));
  const parsedLimitPrice = Number(limitPriceText.replace(/[^0-9.]/g, ""));
  const safeLimitPrice = Number.isFinite(parsedLimitPrice) && parsedLimitPrice > 0
    ? roundCurrency(parsedLimitPrice)
    : defaultLimitPrice;
  const cost = roundCurrency((orderMode === "LIMIT" ? safeLimitPrice : price) * orderSize);
  const heatDelta = getValueBasedTradeHeatDelta(commodity.ticker, cost);
  const selectedLimitOrders = limitOrders.filter((order) => order.ticker === commodity.ticker);
  const activeLimitOrder = selectedLimitOrders.find((order) => order.status === "open" && order.side === side);
  const visibleLimitOrders = [
    ...selectedLimitOrders.filter((order) => order.status === "open"),
    ...limitOrders.filter((order) => order.status !== "open"),
  ].slice(0, 3);
  const pressureCopy = pressureCommand
    ? `${pressureCommand.pressureLabel} // ${pressureCommand.ticksRemaining}T // ${pressureCommand.standingTier.toUpperCase()} REP`
    : profile?.faction
      ? "FACTION WINDOW DORMANT // WATCH THE PRESSURE STRIP"
      : "BIND A RANK-5 FACTION TO ADD PRESSURE WINDOWS";
  const limitTriggerCopy = side === "BUY"
    ? `AUTO-BUY IF ${commodity.ticker} PRINTS <= ${safeLimitPrice.toFixed(2)}`
    : `AUTO-SELL IF ${commodity.ticker} PRINTS >= ${safeLimitPrice.toFixed(2)}`;
  const limitOrderDisabled = orderMode !== "LIMIT" || tradeBlocked || isBusy || Boolean(activeLimitOrder) || (side === "SELL" && maxSell <= 0) || safeLimitPrice <= 0;
  const marketOrderDisabled = tradeBlocked || isBusy || (side === "SELL" && maxSell <= 0);

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

  React.useEffect(() => {
    setLimitPriceText(defaultLimitPrice.toFixed(2));
  }, [commodity.ticker, side]);

  const execute = async () => {
    setConfirmVisible(false);
    if (orderMode === "LIMIT") {
      placeLimitOrder({
        ticker: commodity.ticker,
        side: side as LimitOrderSide,
        quantity: orderSize,
        limitPrice: safeLimitPrice,
        durationTicks: 12,
      });
      setFlash("success");
      setTimeout(() => setFlash(null), 700);
      return;
    }

    if (side === "BUY") {
      await buySelected();
    } else {
      await sellSelected();
    }
    setFlash("success");
    setTimeout(() => setFlash(null), 700);
  };

  const handleOperatorAction = async (action: OperatorBriefAction) => {
    const targetPosition = action.ticker ? positions[action.ticker] : Object.values(positions)[0];

    if (action.kind === "wait-tick" || action.kind === "cool-heat") {
      await advanceMarket();
      return;
    }

    if (action.kind === "select-starter") {
      selectTicker(FIRST_TRADE_HINT_TICKER);
      setSide("BUY");
      setOrderMode("MARKET");
      setOrderSize(DEFAULT_TRADE_QUANTITY);
      return;
    }

    if (action.kind === "buy-starter") {
      setSide("BUY");
      setOrderMode("MARKET");
      setOrderSize(DEFAULT_TRADE_QUANTITY);
      setConfirmVisible(true);
      return;
    }

    if ((action.kind === "sell-green" || action.kind === "close-thread") && targetPosition) {
      selectTicker(targetPosition.ticker);
      setSide("SELL");
      setOrderMode("MARKET");
      setOrderSize(targetPosition.quantity);
      if (targetPosition.ticker === commodity.ticker) {
        setConfirmVisible(true);
      }
      return;
    }

    if (action.kind === "upgrade-lane") {
      selectTicker("PGAS");
      setSide("BUY");
      setOrderMode("MARKET");
    }
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
      <DeckSectionHeader
        label="ORDER_PIPE // LIVE_TERMINAL"
        detail={`${commodity.ticker} // ${currentLocation.name.toUpperCase()}`}
        style={{ marginBottom: 12 }}
      />

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
          heat={resources.heat}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <OperatorBrief
          surface="terminal"
          positions={positions}
          firstTradeComplete={firstTradeComplete}
          selectedTicker={commodity.ticker}
          heat={resources.heat}
          onAction={(action) => void handleOperatorAction(action)}
        />
      </View>

      <DeckSectionHeader label="MARKET_TAPE // ASSET_STREAM" detail={`${DEMO_COMMODITIES.length} CHANNELS`} />
      <NeonBorder active style={{ padding: 0 }}>
        <MarketTapeHeader />
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

      <DeckSectionHeader
        label="EXECUTION_RACK // ORDER_DRAFT"
        detail={`${side} // ${commodity.ticker}`}
        accent={side === "BUY" ? "cyan" : "amber"}
        style={{ marginTop: 16 }}
      />
      <NeonBorder
        active
        style={{
          borderColor: tradeJuice && clock.nowMs - tradeJuice.createdAt < 1500
            ? tradeJuice.kind === "profit"
              ? terminalColors.green
              : tradeJuice.kind === "loss"
                ? terminalColors.red
                : terminalColors.amber
            : undefined,
        }}
      >
        <TerminalPressureStrip command={pressureCommand} />
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
          <TicketSummaryRow
            label="LIMIT TRIGGER"
            value={pressureCommand?.triggerLabel ?? "AGENTOS FACTION REQUIRED"}
            color={pressureCommand ? terminalColors.cyan : terminalColors.dim}
          />
          <TicketSummaryRow
            label="WINDOW"
            value={pressureCommand?.triggerDetail ?? "PREVIEW LOCKED"}
            color={pressureCommand ? terminalColors.muted : terminalColors.dim}
          />
        </View>
        <View style={{ marginTop: 16 }}>
          <ActionButton
            variant="primary"
            glowing
            label="[ EXECUTE ]"
            disabled={orderMode === "LIMIT" ? true : marketOrderDisabled}
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

      <NeonBorder active={orderMode === "LIMIT" || Boolean(activeLimitOrder)} style={{ marginTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
              AGENTOS // LIMIT_ORD_MOD
            </Text>
            <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, lineHeight: 14 }}>
              OPTIONAL AUTO-EXECUTION LAYER // MARKET COMMANDS STAY LIVE
            </Text>
          </View>
          {activeLimitOrder ? (
            <Pressable
              hitSlop={4}
              onPress={() => cancelLimitOrder(activeLimitOrder.id)}
              style={{
                minHeight: 44,
                borderWidth: 1,
                borderColor: terminalColors.red,
                paddingHorizontal: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 9 }}>[X] CLEAR</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {(["MARKET", "LIMIT"] as const).map((mode) => (
            <Pressable
              key={mode}
              hitSlop={4}
              onPress={() => setOrderMode(mode)}
              style={{
                flex: 1,
                minHeight: 44,
                borderWidth: 1,
                borderColor: orderMode === mode ? terminalColors.cyan : terminalColors.borderDim,
                backgroundColor: orderMode === mode ? terminalColors.cyanFill : terminalColors.background,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ fontFamily: terminalFont, color: orderMode === mode ? terminalColors.cyan : terminalColors.muted, fontSize: 11, fontWeight: "700" }}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>TRIGGER PRICE [0BOL]</Text>
          <View style={{ minHeight: 48, marginTop: 6, borderWidth: 1, borderColor: terminalColors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8 }}>
            <TextInput
              value={limitPriceText}
              onChangeText={(value) => setLimitPriceText(value.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={{ flex: 1, color: terminalColors.text, fontFamily: terminalFont, fontSize: 16, minHeight: 46 }}
            />
            <View style={{ minHeight: 30, borderWidth: 1, borderColor: terminalColors.cyan, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" }}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 9 }}>
                EXP T+{tick + 12}
              </Text>
            </View>
          </View>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
            // {limitTriggerCopy}. NO FUNDS ARE RESERVED; THE DECK RECHECKS ENERGY, HEAT, 0BOL, AND HOLDINGS AT FILL TIME.
          </Text>
        </View>

        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 4,
                minHeight: 22,
                backgroundColor: pressureCommand?.direction === "suppress"
                  ? terminalColors.amber
                  : pressureCommand
                    ? terminalColors.green
                    : terminalColors.dim,
              }}
            />
            <Text style={{ flex: 1, fontFamily: terminalFont, color: terminalColors.text, fontSize: 10, fontWeight: "700" }}>
              FACTION PRESSURE WINDOW
            </Text>
          </View>
          <Text style={{ marginTop: 5, fontFamily: terminalFont, color: pressureCommand ? terminalColors.green : terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
            {pressureCopy}
          </Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <ActionButton
            variant="primary"
            glowing={orderMode === "LIMIT" && !activeLimitOrder}
            label={activeLimitOrder ? "[ LIMIT ARMED ]" : orderMode === "LIMIT" ? "[ ARM LIMIT ORDER ]" : "[ MARKET MODE ACTIVE ]"}
            disabled={limitOrderDisabled}
            onPress={() => {
              placeLimitOrder({
                ticker: commodity.ticker,
                side: side as LimitOrderSide,
                quantity: orderSize,
                limitPrice: safeLimitPrice,
                durationTicks: 12,
              });
            }}
          />
        </View>

        {lastLimitOrderFill ? (
          <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.green, fontSize: 10, lineHeight: 15 }}>
            LAST LIMIT FILL // {lastLimitOrderFill.side} {lastLimitOrderFill.quantity} {lastLimitOrderFill.ticker} @ {lastLimitOrderFill.executionPrice.toFixed(2)}
          </Text>
        ) : null}

        {visibleLimitOrders.length ? (
          <View style={{ marginTop: 4 }}>
            {visibleLimitOrders.map((order) => (
              <LimitOrderStatusRow
                key={order.id}
                order={order}
                onCancel={order.status === "open" ? () => cancelLimitOrder(order.id) : undefined}
              />
            ))}
          </View>
        ) : (
          <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 10 }}>
            NO LIMIT ORDERS ARMED
          </Text>
        )}
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

      <DeckSectionHeader
        label="CARGO_LEDGER // OPEN_RISK"
        detail={`${Object.values(positions).length} POSITIONS`}
        accent={Object.values(positions).length ? "green" : "muted"}
        style={{ marginTop: 16 }}
      />
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

      <DeckSectionHeader
        label="SIGNAL_FEED // RUMOR_TAPE"
        detail={`${activeNews.length} SIGNALS`}
        accent="amber"
        style={{ marginTop: 16 }}
      />
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
        message={orderMode === "LIMIT"
          ? `ARM ${side} LIMIT ${orderSize} ${commodity.ticker} @ ${safeLimitPrice.toFixed(2)} 0BOL?`
          : `${side} ${orderSize} ${commodity.ticker} @ ${price.toFixed(2)} 0BOL?`}
        onConfirm={execute}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

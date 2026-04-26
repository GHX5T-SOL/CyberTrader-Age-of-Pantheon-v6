import * as React from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import AnimatedNumber from "@/components/animated-number";
import AwayReportPanel from "@/components/away-report";
import CommodityRow from "@/components/commodity-row";
import DailyChallengesPanel from "@/components/daily-challenges-panel";
import FlashEventBanner from "@/components/flash-event-banner";
import { FirstSessionCue } from "@/components/first-session-cue";
import LocationBanner from "@/components/location-banner";
import MetricChip from "@/components/metric-chip";
import MissionBanner from "@/components/mission-banner";
import PulsingDot from "@/components/pulsing-dot";
import RouteRecoveryScreen from "@/components/route-recovery-screen";
import StreakDisplay from "@/components/streak-display";
import { BurgerTrigger } from "@/components/burger-menu";
import { useMenu } from "@/context/menu-context";
import { getLocation, getUnlockedLocations } from "@/data/locations";
import { getActiveDistrictState } from "@/engine/district-state";
import { DEMO_COMMODITIES, formatObol } from "@/engine/demo-market";
import { useDemoRouteGuard } from "@/hooks/use-demo-route-guard";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

function percentChange(change: number, price: number) {
  return price ? (change / Math.max(1, price - change)) * 100 : 0;
}

function truncateHandle(handle: string) {
  if (!handle) {
    return "LOCAL...000";
  }
  return handle.length > 9 ? `${handle.slice(0, 6)}...${handle.slice(-3)}` : handle;
}

export default function HomeRoute() {
  const routeReady = useDemoRouteGuard();
  const menu = useMenu();
  const handle = useDemoStore((state) => state.handle);
  const resources = useDemoStore((state) => state.resources);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const balance = useDemoStore((state) => state.balanceObol);
  const positions = useDemoStore((state) => state.positions);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const activeNews = useDemoStore((state) => state.activeNews);
  const progression = useDemoStore((state) => state.progression);
  const clock = useDemoStore((state) => state.clock);
  const world = useDemoStore((state) => state.world);
  const transitShipments = useDemoStore((state) => state.transitShipments);
  const activeFlashEvent = useDemoStore((state) => state.activeFlashEvent);
  const pendingMission = useDemoStore((state) => state.pendingMission);
  const activeMission = useDemoStore((state) => state.activeMission);
  const streak = useDemoStore((state) => state.streak);
  const dailyChallenges = useDemoStore((state) => state.dailyChallenges);
  const districtStates = useDemoStore((state) => state.districtStates);
  const bounty = useDemoStore((state) => state.bounty);
  const awayReport = useDemoStore((state) => state.awayReport);
  const heatWarning = useDemoStore((state) => state.heatWarning);
  const rankCelebration = useDemoStore((state) => state.rankCelebration);
  const tutorialCompleted = useDemoStore((state) => state.tutorialCompleted);
  const openMarket = useDemoStore((state) => state.openMarket);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const purchaseEnergyHours = useDemoStore((state) => state.purchaseEnergyHours);
  const startTravel = useDemoStore((state) => state.startTravel);
  const reduceHeatWithBribe = useDemoStore((state) => state.reduceHeatWithBribe);
  const claimShipment = useDemoStore((state) => state.claimShipment);
  const acceptMission = useDemoStore((state) => state.acceptMission);
  const declineMission = useDemoStore((state) => state.declineMission);
  const claimDailyChallenge = useDemoStore((state) => state.claimDailyChallenge);
  const dismissAwayReport = useDemoStore((state) => state.dismissAwayReport);
  const [energyModal, setEnergyModal] = React.useState(false);
  const [travelModal, setTravelModal] = React.useState(false);
  const [hours, setHours] = React.useState(1);

  React.useEffect(() => {
    if (!tutorialCompleted) {
      const timer = setTimeout(() => router.push("/tutorial"), 600);
      return () => clearTimeout(timer);
    }
  }, [tutorialCompleted]);

  React.useEffect(() => {
    if (!heatWarning || clock.nowMs - heatWarning.createdAt > 2500 || Platform.OS === "web") {
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [clock.nowMs, heatWarning]);

  const energyHours = Math.floor(resources.energySeconds / 3600);
  const energyPercent = Math.min(100, Math.round((resources.energySeconds / (72 * 3600)) * 100));
  const energyColor = energyHours > 24 ? "green" : energyHours >= 6 ? "amber" : "red";
  const heatColor = resources.heat < 30 ? "green" : resources.heat < 70 ? "amber" : "red";
  const latestNews = activeNews[0];
  const currentLocation = getLocation(world.currentLocationId);
  const district = getActiveDistrictState(districtStates, world.currentLocationId, clock.nowMs);
  const travelling = Boolean(world.travelDestinationId && world.travelEndTime && world.travelEndTime > clock.nowMs);
  const visibleShipments = transitShipments.filter((shipment) => shipment.status === "transit" || shipment.status === "arrived");
  const nextXp = progression.nextXpRequired === null
    ? 0
    : Math.max(0, progression.nextXpRequired - progression.xp);

  if (!routeReady) {
    return <RouteRecoveryScreen title="RECOVERING HOME ROUTE" />;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 34, backgroundColor: terminalColors.background }}>
      <BurgerTrigger onPress={menu.openMenu} style={{ position: "absolute", top: 8, right: 16, zIndex: 20 }} />
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingRight: 62 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, fontSize: 9, color: terminalColors.muted, letterSpacing: 2 }}>
          CYBERTRADER: AGE OF PANTHEON
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, fontSize: 11, color: terminalColors.text, marginTop: 4 }}>
          EIDOLON ID: {truncateHandle(handle)} // {clock.displayTime}
        </Text>
      </View>

      <LocationBanner
        currentLocationId={world.currentLocationId}
        travelDestinationId={world.travelDestinationId}
        travelEndTime={world.travelEndTime}
        nowMs={clock.nowMs}
        districtState={district.state}
        onTravelPress={() => setTravelModal(true)}
      />

      <View style={{ marginTop: 16, paddingHorizontal: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <MetricChip
          label="ENERGY"
          value={`${energyHours}h`}
          subValue={`${energyPercent}%`}
          progressValue={energyPercent}
          progressColor={energyColor}
          icon="EN"
          accentColor={energyColor === "green" ? terminalColors.green : energyColor === "amber" ? terminalColors.amber : terminalColors.red}
          onPress={() => setEnergyModal(true)}
        />
        <MetricChip
          label="HEAT"
          value={`${resources.heat}%`}
          subValue={`STATUS: ${bounty.status}`}
          progressValue={resources.heat}
          progressColor={heatColor}
          icon="HT"
          accentColor={heatColor === "green" ? terminalColors.green : heatColor === "amber" ? terminalColors.amber : terminalColors.red}
        />
        <MetricChip
          label="0BOL BALANCE"
          value={formatObol(balance)}
          icon="0B"
          accentColor={terminalColors.cyan}
        />
        <MetricChip
          label="MARKET SIGNAL"
          value={latestNews?.headline.toUpperCase().slice(0, 25) || "ALL CLEAR"}
          subValue={latestNews ? `CRED ${Math.round(latestNews.credibility * 100)}%` : "NO SIGNALS"}
          icon="SIG"
          accentColor={terminalColors.amber}
        />
        <MetricChip
          label="RANK"
          value={`${progression.level} ${progression.title}`.slice(0, 25)}
          subValue={progression.nextXpRequired === null ? "MAX RANK" : `${nextXp} XP TO NEXT`}
          icon="XP"
          accentColor={terminalColors.green}
        />
      </View>

      <View style={{ marginTop: 8, marginHorizontal: 12 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 11 }}>
          RANK: {progression.title} {"->"} NEXT: {progression.nextXpRequired === null ? "MAX" : `${nextXp} XP`}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>LIVE 0BOL:</Text>
          <AnimatedNumber
            value={balance}
            style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}
          />
        </View>
      </View>

      <AwayReportPanel report={awayReport} onDismiss={dismissAwayReport} />
      {activeFlashEvent ? <FlashEventBanner event={activeFlashEvent} nowMs={clock.nowMs} /> : null}
      {pendingMission || activeMission ? (
        <MissionBanner
          mission={(activeMission ?? pendingMission)!}
          nowMs={clock.nowMs}
          onAccept={acceptMission}
          onDecline={declineMission}
        />
      ) : null}
      <StreakDisplay streak={streak} nowMs={clock.nowMs} />
      <DailyChallengesPanel challenges={dailyChallenges} onClaim={(id) => void claimDailyChallenge(id)} />

      <View style={{ marginTop: 14, marginHorizontal: 12 }}>
        <FirstSessionCue
          surface="home"
          positions={positions}
          firstTradeComplete={firstTradeComplete}
          selectedTicker={selectedTicker}
        />
      </View>

      {heatWarning && clock.nowMs - heatWarning.createdAt < 2500 ? (
        <View style={{ marginTop: 12, marginHorizontal: 12, borderWidth: 1, borderColor: terminalColors.red, padding: 10 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>
            HEAT THRESHOLD {heatWarning.threshold} CROSSED
          </Text>
        </View>
      ) : null}

      {rankCelebration && clock.nowMs - rankCelebration.createdAt < 3000 ? (
        <View style={{ marginTop: 12, marginHorizontal: 12, borderWidth: 1, borderColor: terminalColors.cyan, backgroundColor: terminalColors.panel, padding: 14 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 22, textAlign: "center" }}>
            RANK UP // {rankCelebration.title.toUpperCase()}
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: 20, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <PulsingDot />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flex: 1, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 14 }}>
            S1LKROAD 4.0 LIVE // {currentLocation.name.toUpperCase()}
          </Text>
        </View>
        <View style={{ height: 1, backgroundColor: terminalColors.cyan, opacity: 0.3, marginTop: 8, marginBottom: 4 }} />
        {DEMO_COMMODITIES.slice(0, 5).map((commodity, index) => {
          const price = prices[commodity.ticker] ?? commodity.basePrice;
          return (
            <CommodityRow
              key={commodity.ticker}
              ticker={commodity.ticker}
              name={commodity.name}
              price={price}
              changePercent={percentChange(changes[commodity.ticker] ?? 0, price)}
              index={index}
              onPress={() => {
                selectTicker(commodity.ticker);
                router.push({ pathname: "/terminal", params: { ticker: commodity.ticker } });
              }}
            />
          );
        })}
      </View>

      <View style={{ marginTop: 24, paddingHorizontal: 16, gap: 12 }}>
        <ActionButton
          variant="primary"
          glowing={!travelling}
          disabled={travelling}
          label={travelling ? "[ TRAVELLING - MARKET LOCKED ]" : "[ ENTER S1LKROAD 4.0 ]"}
          onPress={() => {
            openMarket();
            router.push("/terminal");
          }}
        />
        <ActionButton variant="amber" label="[ BUY ENERGY ]" onPress={() => setEnergyModal(true)} />
        {currentLocation.special === "heat_reduction" ? (
          <ActionButton variant="muted" label="[ REDUCE HEAT - 50,000 0BOL ]" onPress={() => void reduceHeatWithBribe()} />
        ) : null}
      </View>

      {visibleShipments.length ? (
        <View style={{ marginTop: 18, paddingHorizontal: 16 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>SHIPMENTS</Text>
          {visibleShipments.map((shipment) => {
            const remainingMs = Math.max(0, shipment.arrivalTime - clock.nowMs);
            const etaMinutes = Math.floor(remainingMs / 60_000);
            const etaSeconds = Math.floor((remainingMs % 60_000) / 1000);
            const canClaim = shipment.status === "arrived" && shipment.destinationId === world.currentLocationId;
            return (
              <View key={shipment.id} style={{ marginTop: 8, borderWidth: 1, borderColor: terminalColors.borderDim, padding: 8 }}>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  {shipment.ticker} x{shipment.quantity} // {getLocation(shipment.destinationId).name.toUpperCase()}
                </Text>
                <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                  {shipment.status === "transit" ? `ETA ${etaMinutes}m ${etaSeconds}s` : "ARRIVED"} // RISK {(shipment.riskLevel ?? "medium").toUpperCase()}
                </Text>
                {canClaim ? (
                  <Pressable onPress={() => void claimShipment(shipment.id)} style={{ marginTop: 6 }}>
                    <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>[ CLAIM ]</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={{ marginTop: 20, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between" }}>
        {[
          ["[TRADE]", () => {
            openMarket();
            router.push("/terminal");
          }],
          ["[MISSIONS]", () => {
            router.push("/missions");
          }],
          ["[UPGRADE]", () => router.push("/menu/progression")],
        ].map(([label, action]) => (
          <Pressable
            key={String(label)}
            onPress={action as () => void}
            hitSlop={4}
            style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: terminalColors.borderDim, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" }}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>{String(label)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ marginTop: 30, textAlign: "center", fontFamily: terminalFont, color: terminalColors.border, fontSize: 9 }}>
        //PIRATE OS v0.1.3
      </Text>

      <Modal visible={energyModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: terminalColors.modalBackdrop, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 320, borderWidth: 1, borderColor: terminalColors.cyan, backgroundColor: terminalColors.panel, padding: 18 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 14 }}>BUY ENERGY: 1h = 1,000 0BOL</Text>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 28, marginTop: 16 }}>{hours}h</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <ActionButton variant="muted" label="[ - ]" onPress={() => setHours((value) => Math.max(1, value - 1))} />
              <ActionButton variant="muted" label="[ + ]" onPress={() => setHours((value) => Math.min(24, value + 1))} />
            </View>
            <View style={{ marginTop: 14 }}>
              <ActionButton
                variant="primary"
                label="[ CONFIRM ENERGY ]"
                onPress={() => {
                  void purchaseEnergyHours(hours);
                  setEnergyModal(false);
                }}
              />
            </View>
            <Pressable onPress={() => setEnergyModal(false)} style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>[ CANCEL ]</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={travelModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: terminalColors.modalBackdrop, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 340, borderWidth: 1, borderColor: terminalColors.cyan, backgroundColor: terminalColors.panel, padding: 18 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 14 }}>TRAVEL ROUTES</Text>
            {getUnlockedLocations()
              .filter((location) => location.id !== world.currentLocationId)
              .map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => {
                    startTravel(location.id);
                    setTravelModal(false);
                  }}
                  style={{ marginTop: 10, borderWidth: 1, borderColor: terminalColors.borderDim, padding: 10 }}
                >
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
                    {location.name.toUpperCase()} // {location.travelTime}m
                  </Text>
                  <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                    PRICE MOD x{location.priceMod.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            <Pressable onPress={() => setTravelModal(false)} style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>[ CANCEL ]</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

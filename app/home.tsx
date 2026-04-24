import * as React from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import CommodityRow from "@/components/commodity-row";
import ConfirmModal from "@/components/confirm-modal";
import MetricChip from "@/components/metric-chip";
import PulsingDot from "@/components/pulsing-dot";
import { BurgerTrigger } from "@/components/burger-menu";
import { useMenu } from "@/context/menu-context";
import { DEMO_COMMODITIES, formatObol } from "@/engine/demo-market";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
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
  useDemoBootstrap();
  const menu = useMenu();
  const handle = useDemoStore((state) => state.handle);
  const resources = useDemoStore((state) => state.resources);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const balance = useDemoStore((state) => state.balanceObol);
  const activeNews = useDemoStore((state) => state.activeNews);
  const tutorialCompleted = useDemoStore((state) => state.tutorialCompleted);
  const openMarket = useDemoStore((state) => state.openMarket);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const purchaseEnergyHours = useDemoStore((state) => state.purchaseEnergyHours);
  const [energyModal, setEnergyModal] = React.useState(false);
  const [hours, setHours] = React.useState(1);
  const [missionFlash, setMissionFlash] = React.useState("");

  React.useEffect(() => {
    if (!tutorialCompleted) {
      const timer = setTimeout(() => router.push("/tutorial"), 600);
      return () => clearTimeout(timer);
    }
  }, [tutorialCompleted]);

  const energyHours = Math.floor(resources.energySeconds / 3600);
  const energyPercent = Math.min(100, Math.round((resources.energySeconds / (72 * 3600)) * 100));
  const energyColor = energyHours > 24 ? "green" : energyHours >= 6 ? "amber" : "red";
  const heatColor = resources.heat < 30 ? "green" : resources.heat < 70 ? "amber" : "red";
  const latestNews = activeNews[0];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 34, backgroundColor: terminalColors.background }}>
      <BurgerTrigger onPress={menu.openMenu} style={{ position: "absolute", top: 8, right: 16, zIndex: 20 }} />
      <View style={{ paddingTop: 8, paddingHorizontal: 16 }}>
        <Text style={{ fontFamily: terminalFont, fontSize: 9, color: terminalColors.muted, letterSpacing: 2 }}>
          CYBERTRADER: AGE OF PANTHEON
        </Text>
        <Text style={{ fontFamily: terminalFont, fontSize: 11, color: terminalColors.text, marginTop: 4 }}>
          EIDOLON ID: {truncateHandle(handle)}
        </Text>
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <MetricChip
          label="ENERGY"
          value={`${energyHours}h`}
          subValue={`${energyPercent}%`}
          progressValue={energyPercent}
          progressColor={energyColor}
          icon="⚡"
          accentColor={energyColor === "green" ? terminalColors.green : energyColor === "amber" ? terminalColors.amber : terminalColors.red}
          onPress={() => setEnergyModal(true)}
        />
        <MetricChip
          label="HEAT"
          value={`${resources.heat}%`}
          subValue={`${resources.heat}/100`}
          progressValue={resources.heat}
          progressColor={heatColor}
          icon="🔥"
          accentColor={heatColor === "green" ? terminalColors.green : heatColor === "amber" ? terminalColors.amber : terminalColors.red}
        />
        <MetricChip
          label="MARKET SIGNAL"
          value={latestNews?.headline.slice(0, 25) || "ALL CLEAR"}
          subValue={latestNews ? `TICK ${latestNews.tickPublished}` : "NO SIGNALS"}
          icon="📡"
          accentColor={terminalColors.amber}
        />
        <MetricChip
          label="0BOL BALANCE"
          value={formatObol(balance)}
          icon="💰"
          accentColor={terminalColors.cyan}
        />
      </View>

      <View style={{ marginTop: 20, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <PulsingDot />
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 14 }}>S1LKROAD 4.0 LIVE</Text>
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
          glowing
          label="[ ENTER S1LKROAD 4.0 ]"
          onPress={() => {
            openMarket();
            router.push("/terminal");
          }}
        />
        <ActionButton variant="amber" label="[ BUY ENERGY ]" onPress={() => setEnergyModal(true)} />
      </View>

      <View style={{ marginTop: 20, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between" }}>
        {[
          ["[TRADE]", () => {
            openMarket();
            router.push("/terminal");
          }],
          ["[MISSIONS]", () => {
            setMissionFlash("AGENTOS MISSION GRID LOCKED");
            setTimeout(() => setMissionFlash(""), 1400);
          }],
          ["[UPGRADE]", () => router.push("/menu/progression")],
        ].map(([label, action]) => (
          <Pressable key={String(label)} onPress={action as () => void} style={{ borderWidth: 1, borderColor: terminalColors.borderDim, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>{String(label)}</Text>
          </Pressable>
        ))}
      </View>
      {missionFlash ? (
        <Text style={{ marginTop: 10, textAlign: "center", fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>{missionFlash}</Text>
      ) : null}
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
    </ScrollView>
  );
}


import * as React from "react";
import { Pressable, Text, View } from "react-native";
import CourierModal from "@/components/courier-modal";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { getFlashCourierCostMultiplier } from "@/engine/flash-events";
import { getActiveDistrictState, getDistrictCourierTimeMultiplier } from "@/engine/district-state";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function InventoryMenuRoute() {
  const positions = Object.values(useDemoStore((state) => state.positions));
  const prices = useDemoStore((state) => state.prices);
  const progression = useDemoStore((state) => state.progression);
  const world = useDemoStore((state) => state.world);
  const clock = useDemoStore((state) => state.clock);
  const activeFlashEvent = useDemoStore((state) => state.activeFlashEvent);
  const districtStates = useDemoStore((state) => state.districtStates);
  const transitShipments = useDemoStore((state) => state.transitShipments);
  const sendCourierShipment = useDemoStore((state) => state.sendCourierShipment);
  const used = positions.length;
  const activeCourierCount = transitShipments.filter((shipment) => shipment.status === "transit").length;
  const courierLimit = 3 + Math.floor(Math.max(0, progression.level - 1) / 10);
  const district = getActiveDistrictState(districtStates, world.currentLocationId, clock.nowMs);
  const [courierTicker, setCourierTicker] = React.useState<string | null>(null);
  const courierPosition = positions.find((position) => position.ticker === courierTicker);

  return (
    <MenuScreen title="COMMODITY INVENTORY">
      <NeonBorder active>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>
          {used}/{progression.inventorySlots} SLOTS
        </Text>
        <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
          COURIERS {activeCourierCount}/{courierLimit}
        </Text>
        <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 8 }}>
          <View
            style={{
              height: 6,
              width: `${Math.min(100, (used / progression.inventorySlots) * 100)}%`,
              backgroundColor: terminalColors.cyan,
            }}
          />
        </View>
        {positions.length ? (
          positions.map((position) => {
            const current = prices[position.ticker] ?? position.avgEntry;
            const value = current * position.quantity;
            const pnl = (current - position.avgEntry) * position.quantity + position.realizedPnl;
            return (
              <View key={position.id} style={{ borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 12, marginTop: 12 }}>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>{position.ticker}</Text>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  QTY {position.quantity} AVG {position.avgEntry.toFixed(2)} VALUE {value.toFixed(2)} PNL {pnl.toFixed(2)}
                </Text>
                <Pressable onPress={() => setCourierTicker(position.ticker)} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 11 }}>[ SEND VIA COURIER ]</Text>
                </Pressable>
              </View>
            );
          })
        ) : (
          <Text style={{ marginTop: 18, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 12 }}>NO COMMODITIES HELD</Text>
        )}
      </NeonBorder>
      {courierPosition ? (
        <CourierModal
          visible={Boolean(courierTicker)}
          ticker={courierPosition.ticker}
          maxQuantity={courierPosition.quantity}
          currentLocationId={world.currentLocationId}
          costMultiplier={getFlashCourierCostMultiplier(activeFlashEvent)}
          arrivalTimeMultiplier={getDistrictCourierTimeMultiplier(district.state)}
          onClose={() => setCourierTicker(null)}
          onSend={(input) => {
            void sendCourierShipment({
              ticker: courierPosition.ticker,
              quantity: input.quantity,
              destinationId: input.destinationId,
              courierId: input.courierId,
            });
            setCourierTicker(null);
          }}
        />
      ) : null}
    </MenuScreen>
  );
}

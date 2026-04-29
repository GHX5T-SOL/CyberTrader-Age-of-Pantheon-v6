import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import CourierModal from "@/components/courier-modal";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { getLocation } from "@/data/locations";
import {
  FIRST_TRADE_HINT_TICKER,
  formatObol,
  getCommodity,
} from "@/engine/demo-market";
import { getFlashCourierCostMultiplier } from "@/engine/flash-events";
import {
  getActiveDistrictState,
  getDistrictCourierRiskBonus,
  getDistrictCourierRiskMultiplier,
  getDistrictCourierTimeMultiplier,
} from "@/engine/district-state";
import {
  STARTER_GUIDANCE_QUANTITY,
  getStrategyCueLines,
} from "@/engine/strategy-guidance";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const BAY_ASCII = ["[ -- -- -- ]", "|  ::::::  |", "|  ::::::  |", "[__________]"];

function formatTransitEta(arrivalMs: number, nowMs: number): string {
  const remaining = Math.max(0, arrivalMs - nowMs);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  if (minutes <= 0 && seconds <= 0) {
    return "ARRIVING";
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function InventoryMenuRoute() {
  const positions = Object.values(useDemoStore((state) => state.positions));
  const prices = useDemoStore((state) => state.prices);
  const progression = useDemoStore((state) => state.progression);
  const world = useDemoStore((state) => state.world);
  const clock = useDemoStore((state) => state.clock);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const activeFlashEvent = useDemoStore((state) => state.activeFlashEvent);
  const districtStates = useDemoStore((state) => state.districtStates);
  const bounty = useDemoStore((state) => state.bounty);
  const transitShipments = useDemoStore((state) => state.transitShipments);
  const sendCourierShipment = useDemoStore((state) => state.sendCourierShipment);

  const used = positions.length;
  const transitInFlight = transitShipments.filter((shipment) => shipment.status === "transit");
  const activeCourierCount = transitInFlight.length;
  const courierLimit = progression.level >= 10 ? 5 : 3;
  const district = getActiveDistrictState(districtStates, world.currentLocationId, clock.nowMs);
  const location = getLocation(world.currentLocationId);
  const slotPercent = Math.min(100, (used / progression.inventorySlots) * 100);

  const starterCommodity = getCommodity(FIRST_TRADE_HINT_TICKER);
  const starterPrice = prices[FIRST_TRADE_HINT_TICKER] ?? starterCommodity?.basePrice ?? 0;
  const starterCost = starterPrice * STARTER_GUIDANCE_QUANTITY;
  const starterCueLines = getStrategyCueLines(FIRST_TRADE_HINT_TICKER, { firstTradeComplete });

  const [courierTicker, setCourierTicker] = React.useState<string | null>(null);
  const courierPosition = positions.find((position) => position.ticker === courierTicker);

  const isEmpty = positions.length === 0;

  return (
    <MenuScreen title="COMMODITY INVENTORY">
      <NeonBorder active>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>
            {used}/{progression.inventorySlots} SLOTS
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
            COURIERS {activeCourierCount}/{courierLimit}
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 8 }}>
          <View
            style={{
              height: 6,
              width: `${slotPercent}%`,
              backgroundColor: terminalColors.cyan,
            }}
          />
        </View>
        <Text
          style={{
            marginTop: 6,
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          BAY // {location.name.toUpperCase()} // {used} OF {progression.inventorySlots} BERTHS LIVE
        </Text>

        {isEmpty ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: terminalColors.cyan,
                backgroundColor: terminalColors.cyanFill,
                padding: 12,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 9,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    BAY STATUS
                  </Text>
                  <Text
                    style={{
                      marginTop: 3,
                      fontFamily: terminalFont,
                      color: terminalColors.cyan,
                      fontSize: 13,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    NO COMMODITIES HELD
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontFamily: terminalFont,
                      color: terminalColors.text,
                      fontSize: 11,
                      lineHeight: 16,
                    }}
                  >
                    Cargo bay is staged and clean. Run a first payload from the terminal to fill the rack.
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {BAY_ASCII.map((line, index) => (
                    <Text
                      key={`bay-${index}`}
                      style={{
                        fontFamily: terminalFont,
                        color: index === 0 || index === BAY_ASCII.length - 1
                          ? terminalColors.cyan
                          : terminalColors.muted,
                        fontSize: 10,
                        lineHeight: 12,
                      }}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: terminalColors.amber,
                backgroundColor: "rgba(255,184,0,0.06)",
                padding: 12,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: terminalFont,
                  color: terminalColors.muted,
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                ORACLE STARTER MANIFEST
              </Text>
              <Text
                style={{
                  fontFamily: terminalFont,
                  color: terminalColors.amber,
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {FIRST_TRADE_HINT_TICKER} // {starterCommodity?.name ?? "STARTER"}
              </Text>
              {starterCueLines.map((line, index) => (
                <Text
                  key={`cue-${index}`}
                  style={{
                    fontFamily: terminalFont,
                    color: terminalColors.text,
                    fontSize: 11,
                    lineHeight: 15,
                  }}
                >
                  {line}
                </Text>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                  PROJ COST
                </Text>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  {formatObol(starterCost)} 0BOL
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                  LIQUID
                </Text>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 11 }}>
                  {formatObol(balanceObol)} 0BOL
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.replace("/terminal")}
              hitSlop={6}
              style={({ pressed }) => ({
                minHeight: 48,
                borderWidth: 1,
                borderColor: pressed ? terminalColors.text : terminalColors.cyan,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
                backgroundColor: pressed ? terminalColors.cyanFill : terminalColors.background,
              })}
            >
              {({ pressed }) => (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    fontFamily: terminalFont,
                    color: pressed ? terminalColors.text : terminalColors.cyan,
                    fontSize: 12,
                    fontWeight: "700",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  [ OPEN TERMINAL ]
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          positions.map((position) => {
            const current = prices[position.ticker] ?? position.avgEntry;
            const value = current * position.quantity;
            const pnl = (current - position.avgEntry) * position.quantity + position.realizedPnl;
            return (
              <View
                key={position.id}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: terminalColors.borderDim,
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
                  {position.ticker}
                </Text>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  QTY {position.quantity} AVG {position.avgEntry.toFixed(2)} VALUE {value.toFixed(2)} PNL {pnl.toFixed(2)}
                </Text>
                <Pressable onPress={() => setCourierTicker(position.ticker)} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 11 }}>
                    [ SEND VIA COURIER ]
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </NeonBorder>

      {transitInFlight.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <NeonBorder active={false}>
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.muted,
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              IN-TRANSIT MANIFEST
            </Text>
            <Text
              style={{
                marginTop: 3,
                fontFamily: terminalFont,
                color: terminalColors.amber,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              {transitInFlight.length} COURIER PACKET
              {transitInFlight.length === 1 ? "" : "S"} OUTBOUND
            </Text>
            {transitInFlight.slice(0, 4).map((shipment) => {
              const dest = getLocation(shipment.destinationId);
              const eta = formatTransitEta(shipment.arrivalTime, clock.nowMs);
              return (
                <View
                  key={shipment.id}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: terminalColors.borderDim,
                    paddingTop: 8,
                    marginTop: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>
                    {shipment.ticker} x{shipment.quantity}
                  </Text>
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 10 }}>
                    {dest.name.toUpperCase()} // {eta}
                  </Text>
                </View>
              );
            })}
          </NeonBorder>
        </View>
      ) : null}

      {courierPosition ? (
        <CourierModal
          visible={Boolean(courierTicker)}
          ticker={courierPosition.ticker}
          maxQuantity={courierPosition.quantity}
          currentLocationId={world.currentLocationId}
          costMultiplier={getFlashCourierCostMultiplier(activeFlashEvent, world.currentLocationId)}
          arrivalTimeMultiplier={getDistrictCourierTimeMultiplier(district.state)}
          riskBonus={getDistrictCourierRiskBonus(district.state) + bounty.courierRiskBonus}
          riskMultiplier={getDistrictCourierRiskMultiplier(district.state)}
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

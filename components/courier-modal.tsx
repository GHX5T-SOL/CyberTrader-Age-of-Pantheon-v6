import * as React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import { COURIER_SERVICES, getUnlockedLocations, type CourierService } from "@/data/locations";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface CourierModalProps {
  visible: boolean;
  ticker: string;
  maxQuantity: number;
  currentLocationId: string;
  costMultiplier?: number;
  arrivalTimeMultiplier?: number;
  riskBonus?: number;
  riskMultiplier?: number;
  onClose: () => void;
  onSend: (input: {
    quantity: number;
    destinationId: string;
    courierId: CourierService["id"];
  }) => void;
}

export default function CourierModal({
  visible,
  ticker,
  maxQuantity,
  currentLocationId,
  costMultiplier = 1,
  arrivalTimeMultiplier = 1,
  riskBonus = 0,
  riskMultiplier = 1,
  onClose,
  onSend,
}: CourierModalProps) {
  const destinations = getUnlockedLocations().filter((location) => location.id !== currentLocationId);
  const [quantity, setQuantity] = React.useState(1);
  const [destinationId, setDestinationId] = React.useState(destinations[0]?.id ?? currentLocationId);
  const [courierId, setCourierId] = React.useState<CourierService["id"]>("shadow_haul");

  React.useEffect(() => {
    if (visible) {
      setQuantity(Math.max(1, Math.min(maxQuantity, 1)));
      setDestinationId(destinations[0]?.id ?? currentLocationId);
      setCourierId("shadow_haul");
    }
  }, [currentLocationId, destinations, maxQuantity, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: terminalColors.modalBackdrop, alignItems: "center", justifyContent: "center", padding: 22 }}>
        <View style={{ width: "100%", maxWidth: 360, borderWidth: 1, borderColor: terminalColors.cyan, backgroundColor: terminalColors.panel, padding: 16 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 13 }}>
            SEND {ticker} VIA COURIER
          </Text>
          <Text style={{ marginTop: 12, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>
            QUANTITY {quantity}/{maxQuantity}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <ActionButton variant="muted" label="[ - ]" onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
            <ActionButton variant="muted" label="[ + ]" onPress={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} />
          </View>

          <Text style={{ marginTop: 14, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>
            DESTINATION
          </Text>
          <View style={{ gap: 7, marginTop: 8 }}>
            {destinations.map((location) => (
              <Pressable
                key={location.id}
                onPress={() => setDestinationId(location.id)}
                style={{ borderWidth: 1, borderColor: destinationId === location.id ? terminalColors.cyan : terminalColors.borderDim, padding: 8 }}
              >
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  {location.name.toUpperCase()} // {location.travelTime}m
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ marginTop: 14, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>
            SERVICE
          </Text>
          <View style={{ gap: 7, marginTop: 8 }}>
            {COURIER_SERVICES.map((service) => (
              <Pressable
                key={service.id}
                onPress={() => setCourierId(service.id)}
                style={{ borderWidth: 1, borderColor: courierId === service.id ? terminalColors.amber : terminalColors.borderDim, padding: 8 }}
              >
                {(() => {
                  const adjustedLossChance = Math.min(0.95, service.lossChance * riskMultiplier + riskBonus);
                  const riskPercent = Math.round(adjustedLossChance * 100);
                  const effectiveCost = Math.round(service.cost * costMultiplier);
                  const riskColor = riskPercent >= 30 ? terminalColors.red : riskPercent >= 10 ? terminalColors.amber : terminalColors.green;
                  return (
                    <>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  {service.name.toUpperCase()} // {effectiveCost} 0BOL // RISK {riskPercent}%
                </Text>
                <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
                  ETA x{arrivalTimeMultiplier.toFixed(1)}
                </Text>
                <View style={{ height: 4, backgroundColor: terminalColors.borderDim, marginTop: 5 }}>
                  <View style={{ height: 4, width: `${riskPercent}%`, backgroundColor: riskColor }} />
                </View>
                    </>
                  );
                })()}
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 14 }}>
            <ActionButton
              variant="primary"
              label="[ SEND ]"
              onPress={() => onSend({ quantity, destinationId, courierId })}
            />
          </View>
          <Pressable onPress={onClose} style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>[ CANCEL ]</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export { CourierModal };

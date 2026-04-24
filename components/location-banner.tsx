import { Pressable, Text, View } from "react-native";
import { getLocation } from "@/data/locations";
import type { DistrictState } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface LocationBannerProps {
  currentLocationId: string;
  travelDestinationId: string | null;
  travelEndTime: number | null;
  nowMs: number;
  districtState?: DistrictState;
  onTravelPress: () => void;
}

export default function LocationBanner({
  currentLocationId,
  travelDestinationId,
  travelEndTime,
  nowMs,
  districtState = "NORMAL",
  onTravelPress,
}: LocationBannerProps) {
  const current = getLocation(currentLocationId);
  const destination = getLocation(travelDestinationId);
  const remainingMs = travelEndTime ? Math.max(0, travelEndTime - nowMs) : 0;
  const etaMinutes = Math.floor(remainingMs / 60_000);
  const etaSeconds = Math.floor((remainingMs % 60_000) / 1000);
  const travelling = Boolean(travelDestinationId && remainingMs > 0);
  const stateColor = getStateColor(districtState);

  return (
    <View
      style={{
        marginTop: 12,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: stateColor,
        backgroundColor: terminalColors.panel,
        padding: 10,
        shadowColor: stateColor,
        shadowOpacity: districtState === "NORMAL" ? 0.12 : 0.45,
        shadowRadius: districtState === "BLACKOUT" ? 2 : 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
          LOCATION
        </Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 13 }}>
          {travelling
            ? `TRAVELLING TO ${destination.name.toUpperCase()}`
            : current.name.toUpperCase()}
        </Text>
        <Text style={{ marginTop: 3, fontFamily: terminalFont, color: stateColor, fontSize: 10 }}>
          DISTRICT STATE: {districtState}
        </Text>
        {travelling ? (
          <Text style={{ marginTop: 3, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
            ETA {etaMinutes}m {etaSeconds}s
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onTravelPress}
        disabled={travelling}
        style={{
          borderWidth: 1,
          borderColor: travelling ? terminalColors.borderDim : terminalColors.cyan,
          paddingHorizontal: 10,
          paddingVertical: 7,
          opacity: travelling ? 0.45 : 1,
        }}
      >
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>
          [TRAVEL]
        </Text>
      </Pressable>
    </View>
  );
}

export { LocationBanner };

function getStateColor(state: DistrictState): string {
  if (state === "BOOM") {
    return "#39FF14";
  }
  if (state === "LOCKDOWN") {
    return "#FF3131";
  }
  if (state === "BLACKOUT") {
    return terminalColors.dim;
  }
  if (state === "FESTIVAL") {
    return terminalColors.amber;
  }
  if (state === "GANG_CONTROL") {
    return "#FF6A00";
  }
  if (state === "MARKET_CRASH") {
    return terminalColors.red;
  }
  return terminalColors.borderDim;
}

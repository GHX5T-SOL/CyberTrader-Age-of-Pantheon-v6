import { Pressable, Text, View } from "react-native";
import { getLocation } from "@/data/locations";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface LocationBannerProps {
  currentLocationId: string;
  travelDestinationId: string | null;
  travelEndTime: number | null;
  nowMs: number;
  onTravelPress: () => void;
}

export default function LocationBanner({
  currentLocationId,
  travelDestinationId,
  travelEndTime,
  nowMs,
  onTravelPress,
}: LocationBannerProps) {
  const current = getLocation(currentLocationId);
  const destination = getLocation(travelDestinationId);
  const remainingMs = travelEndTime ? Math.max(0, travelEndTime - nowMs) : 0;
  const etaMinutes = Math.floor(remainingMs / 60_000);
  const etaSeconds = Math.floor((remainingMs % 60_000) / 1000);
  const travelling = Boolean(travelDestinationId && remainingMs > 0);

  return (
    <View
      style={{
        marginTop: 12,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: terminalColors.borderDim,
        backgroundColor: terminalColors.panel,
        padding: 10,
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

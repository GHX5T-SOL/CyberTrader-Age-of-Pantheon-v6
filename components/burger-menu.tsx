import { Pressable, Text, View, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface BurgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const ITEMS = [
  ["PROFILE", "/menu/profile"],
  ["SETTINGS", "/menu/settings"],
  ["INVENTORY", "/menu/inventory"],
  ["PROGRESSION", "/menu/progression"],
  ["RANK / LEADERBOARD", "/menu/rank"],
  ["REWARDS", "/menu/rewards"],
  ["NOTIFICATIONS", "/menu/notifications"],
  ["HELP / HOW TO PLAY", "/menu/help"],
  ["LEGAL", "/menu/legal"],
] as const;

export function BurgerTrigger({ onPress, style }: { onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[{ gap: 3, padding: 8 }, style]}>
      {[0, 1, 2].map((line) => (
        <View key={line} style={{ width: 16, height: 2, backgroundColor: terminalColors.cyan }} />
      ))}
    </Pressable>
  );
}

export default function BurgerMenu({ visible, onClose }: BurgerMenuProps) {
  const router = useRouter();
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: "absolute",
        zIndex: 100,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: terminalColors.overlay,
        paddingTop: 48,
        paddingHorizontal: 18,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: terminalFont, fontSize: 10, color: terminalColors.muted }}>
          NAVIGATION
        </Text>
        <Pressable onPress={onClose}>
          <Text style={{ fontFamily: terminalFont, fontSize: 14, color: terminalColors.muted }}>
            [X]
          </Text>
        </Pressable>
      </View>
      <View style={{ marginTop: 18 }}>
        {ITEMS.map(([label, href]) => (
          <Pressable
            key={href}
            onPress={() => {
              onClose();
              router.push(href);
            }}
            style={({ pressed }) => ({
              height: 48,
              justifyContent: "center",
              borderBottomWidth: 1,
              borderBottomColor: terminalColors.borderDim,
            })}
          >
            {({ pressed }) => (
              <Text
                style={{
                  fontFamily: terminalFont,
                  fontSize: 14,
                  color: pressed ? terminalColors.cyan : terminalColors.text,
                }}
              >
                {label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export { BurgerMenu };

import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant: "primary" | "amber" | "muted";
  disabled?: boolean;
  glowing?: boolean;
}

export default function ActionButton({
  label,
  onPress,
  variant,
  disabled = false,
  glowing = false,
}: ActionButtonProps) {
  const pulse = useSharedValue(0);
  const baseColor =
    variant === "primary" ? terminalColors.cyan : variant === "amber" ? terminalColors.amber : terminalColors.border;
  const pressedColor = variant === "amber" ? terminalColors.amber : terminalColors.cyan;

  pulse.value =
    variant === "primary" && glowing && !disabled
      ? withRepeat(withSequence(withTiming(1, { duration: 1250 }), withTiming(0, { duration: 1250 })), -1)
      : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor:
      disabled
        ? terminalColors.borderDim
        : interpolateColor(pulse.value, [0, 1], [baseColor, terminalColors.cyanDark]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: "100%",
          height: 52,
          borderWidth: 1,
          backgroundColor: terminalColors.panel,
          opacity: disabled ? 0.4 : 1,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        disabled={disabled}
        hitSlop={6}
        onPress={() => {
          if (!disabled) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
            onPress();
          }
        }}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderColor: pressed ? pressedColor : baseColor,
        })}
      >
        {({ pressed }) => (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              fontFamily: terminalFont,
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: pressed ? pressedColor : baseColor,
              textAlign: "center",
              paddingHorizontal: 10,
              maxWidth: "100%",
            }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export { ActionButton };

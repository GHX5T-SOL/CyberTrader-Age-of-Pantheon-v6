import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { terminalColors } from "@/theme/terminal";

interface PulsingDotProps {
  size?: number;
}

export default function PulsingDot({ size = 8 }: PulsingDotProps) {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
    -1,
  );
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: terminalColors.green,
          shadowColor: terminalColors.green,
          shadowOpacity: 0.6,
          shadowRadius: 3,
        },
        style,
      ]}
    />
  );
}

export { PulsingDot };


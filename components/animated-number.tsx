import * as React from "react";
import { Text, type TextStyle } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  style?: TextStyle;
  durationMs?: number;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function AnimatedNumber({
  value,
  formatter = (nextValue) => Math.round(nextValue).toLocaleString("en-US"),
  style,
  durationMs = 400,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    animatedValue.value = withTiming(value, { duration: durationMs });
  }, [animatedValue, durationMs, value]);

  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(setDisplayValue)(current);
    },
    [animatedValue],
  );

  return <AnimatedText style={style}>{formatter(displayValue)}</AnimatedText>;
}

export { AnimatedNumber };


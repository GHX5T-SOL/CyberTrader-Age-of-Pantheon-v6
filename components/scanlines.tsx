import * as React from "react";
import { FlatList, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { terminalColors } from "@/theme/terminal";

const LINE_COUNT = 200;
const LINE_HEIGHT = 4;
const DATA = Array.from({ length: LINE_COUNT }, (_, index) => index);

export default function Scanlines() {
  const opacity = useSharedValue(0.6);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 4000 }), withTiming(0.6, { duration: 4000 })),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        animatedStyle,
      ]}
    >
      <FlatList
        data={DATA}
        keyExtractor={(item) => String(item)}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({
          length: LINE_HEIGHT,
          offset: LINE_HEIGHT * index,
          index,
        })}
        renderItem={() => (
          <View style={{ height: LINE_HEIGHT }}>
            <View style={{ height: 1, backgroundColor: terminalColors.scanlineStrong }} />
          </View>
        )}
      />
    </Animated.View>
  );
}

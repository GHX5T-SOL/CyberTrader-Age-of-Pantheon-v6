import { Pressable, Text, View } from "react-native";
import { ORDER_SIZES } from "@/engine/demo-market";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface OrderSizeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function OrderSizeSelector({ value, onChange }: OrderSizeSelectorProps) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {ORDER_SIZES.map((size) => {
        const selected = size === value;
        return (
          <Pressable
            key={size}
            onPress={() => onChange(size)}
            style={{
              flex: 1,
              alignItems: "center",
              borderWidth: 1,
              borderColor: selected ? palette.accent.magenta : palette.alpha.white16,
              borderRadius: 14,
              backgroundColor: selected ? palette.alpha.magenta18 : palette.bg.card,
              paddingVertical: 10,
            }}
          >
            <Text
              selectable
              style={{
                color: selected ? palette.accent.magenta : palette.fg.muted,
                fontSize: 12,
                fontWeight: "900",
                letterSpacing: 1.3,
                fontFamily: monoFamily,
              }}
            >
              x{size}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

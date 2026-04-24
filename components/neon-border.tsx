import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { terminalColors } from "@/theme/terminal";

interface NeonBorderProps {
  children: ReactNode;
  active?: boolean;
  style?: ViewStyle;
}

export default function NeonBorder({ children, active = false, style }: NeonBorderProps) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: active ? terminalColors.cyan : terminalColors.border,
          padding: 12,
          backgroundColor: terminalColors.panel,
          shadowColor: active ? terminalColors.cyan : "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active ? 0.3 : 0,
          shadowRadius: active ? 4 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export { NeonBorder };


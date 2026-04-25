import { Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface RouteRecoveryScreenProps {
  title?: string;
}

export default function RouteRecoveryScreen({ title = "RECOVERING ROUTE" }: RouteRecoveryScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: terminalColors.background,
      }}
    >
      <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        STITCHING SESSION VECTOR...
      </Text>
    </View>
  );
}

import { View } from "react-native";
import SystemStatePanel from "@/components/system-state-panel";
import { terminalColors } from "@/theme/terminal";

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
      <SystemStatePanel
        kind="loading"
        title={title}
        message="Stitching the local session vector before opening this surface."
        detail="NO PLAYER DATA LEAVES THIS DEVICE"
        style={{ width: "100%", maxWidth: 360 }}
      />
    </View>
  );
}

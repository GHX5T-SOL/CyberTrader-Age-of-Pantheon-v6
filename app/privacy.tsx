import { ScrollView, Text } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function PrivacyPolicy() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: terminalColors.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ color: terminalColors.cyan, fontFamily: terminalFont, fontSize: 24, marginBottom: 12 }}>
        Privacy Policy
      </Text>
      <Text style={{ color: terminalColors.text, fontFamily: terminalFont, fontSize: 14, lineHeight: 20 }}>
        CyberTrader stores the playable launch session locally on this device. The current LocalAuthority mode does not require a wallet, does not execute real-money transactions, and keeps gameplay trades simulated.
      </Text>
    </ScrollView>
  );
}

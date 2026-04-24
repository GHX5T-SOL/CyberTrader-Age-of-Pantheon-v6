import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function LegalMenuRoute() {
  return (
    <MenuScreen title="LEGAL DISCLOSURES">
      <NeonBorder active>
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 14 }}>THIS IS A GAME. NOT FINANCIAL ADVICE.</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            0BOL is a soft in-game currency for progression and local demo trading. It is non-withdrawable and has no cash value.
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            $OBOL is an optional Solana token layer planned for supported regions and compliant flows only. The Phase 1 demo does not require a wallet.
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 11, lineHeight: 18 }}>
            No gambling loops. No loot boxes. Demo trades use deterministic local simulation and fictional commodities.
          </Text>
        </View>
      </NeonBorder>
    </MenuScreen>
  );
}


import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { LAUNCH_ACCOUNT_RECOVERY_COPY } from "@/authority/launch-identity";
import { STORE_SAFE_REVIEWER_COPY } from "@/authority/store-safety";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function LegalMenuRoute() {
  return (
    <MenuScreen title="LEGAL DISCLOSURES">
      <NeonBorder active>
        <View style={{ gap: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 14 }}>THIS IS A GAME. NOT FINANCIAL ADVICE.</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {STORE_SAFE_REVIEWER_COPY.softCurrency}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {STORE_SAFE_REVIEWER_COPY.futureToken}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 11, lineHeight: 18 }}>
            {STORE_SAFE_REVIEWER_COPY.noPrize}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {STORE_SAFE_REVIEWER_COPY.noWallet}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {STORE_SAFE_REVIEWER_COPY.simulation}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {LAUNCH_ACCOUNT_RECOVERY_COPY.legalDisclosure}
          </Text>
        </View>
      </NeonBorder>
    </MenuScreen>
  );
}

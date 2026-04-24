import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function InventoryMenuRoute() {
  const positions = Object.values(useDemoStore((state) => state.positions));
  const prices = useDemoStore((state) => state.prices);
  const used = positions.length;

  return (
    <MenuScreen title="COMMODITY INVENTORY">
      <NeonBorder active>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{used}/10 SLOTS</Text>
        <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 8 }}>
          <View style={{ height: 6, width: `${used * 10}%`, backgroundColor: terminalColors.cyan }} />
        </View>
        {positions.length ? (
          positions.map((position) => {
            const current = prices[position.ticker] ?? position.avgEntry;
            const value = current * position.quantity;
            const pnl = (current - position.avgEntry) * position.quantity + position.realizedPnl;
            return (
              <View key={position.id} style={{ borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 12, marginTop: 12 }}>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>{position.ticker}</Text>
                <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>
                  QTY {position.quantity} AVG {position.avgEntry.toFixed(2)} VALUE {value.toFixed(2)} PNL {pnl.toFixed(2)}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={{ marginTop: 18, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 12 }}>NO COMMODITIES HELD</Text>
        )}
      </NeonBorder>
    </MenuScreen>
  );
}


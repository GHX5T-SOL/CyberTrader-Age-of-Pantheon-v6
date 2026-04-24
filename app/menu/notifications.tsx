import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function NotificationsMenuRoute() {
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const activeNews = useDemoStore((state) => state.activeNews);
  const items = [
    `[12:41] ${systemMessage.toUpperCase()}`,
    ...activeNews.slice(0, 4).map((news) => `[12:4${news.tickPublished}] MARKET SIGNAL: ${news.headline}`),
  ];

  return (
    <MenuScreen title="SYSTEM NOTIFICATIONS">
      <NeonBorder active>
        {items.length ? (
          items.map((item, index) => (
            <View key={`${item}-${index}`} style={{ borderBottomWidth: 1, borderBottomColor: terminalColors.borderDim, paddingVertical: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: index === 0 ? terminalColors.green : terminalColors.amber, fontSize: 11 }}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 12 }}>NO NOTIFICATIONS</Text>
        )}
      </NeonBorder>
    </MenuScreen>
  );
}


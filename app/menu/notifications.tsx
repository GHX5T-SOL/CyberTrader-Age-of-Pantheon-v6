import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function NotificationsMenuRoute() {
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const activeNews = useDemoStore((state) => state.activeNews);
  const notifications = useDemoStore((state) => state.notifications);
  const items = [
    { text: systemMessage.toUpperCase(), tone: "info" },
    ...notifications.map((item) => ({ text: item.message.toUpperCase(), tone: item.tone })),
    ...activeNews.slice(0, 4).map((news) => ({
      text: `MARKET SIGNAL: ${news.headline} // CRED ${Math.round(news.credibility * 100)}%`,
      tone: "warning",
    })),
  ];

  return (
    <MenuScreen title="SYSTEM NOTIFICATIONS">
      <NeonBorder active>
        {items.length ? (
          items.map((item, index) => {
            const color =
              item.tone === "danger"
                ? terminalColors.red
                : item.tone === "success"
                  ? terminalColors.green
                  : item.tone === "warning"
                    ? terminalColors.amber
                    : terminalColors.muted;
            return (
              <View key={`${item.text}-${index}`} style={{ borderBottomWidth: 1, borderBottomColor: terminalColors.borderDim, paddingVertical: 10 }}>
                <Text style={{ fontFamily: terminalFont, color, fontSize: 11 }}>{item.text}</Text>
              </View>
            );
          })
        ) : (
          <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 12 }}>NO NOTIFICATIONS</Text>
        )}
      </NeonBorder>
    </MenuScreen>
  );
}

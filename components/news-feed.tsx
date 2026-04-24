import { Text, View } from "react-native";
import type { MarketNews } from "@/engine/types";
import { SectionCard } from "@/components/section-card";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface NewsFeedProps {
  news: MarketNews[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  const visibleNews = news.slice(0, 3);

  return (
    <SectionCard eyebrow="signal_feed" title="market rumors" tone={visibleNews.length ? "amber" : "cyan"}>
      {visibleNews.length === 0 ? (
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          No clean rumors on this tick. The tape is moving on raw flow.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {visibleNews.map((item) => (
            <View
              key={item.id}
              style={{
                borderLeftWidth: 2,
                borderLeftColor:
                  item.credibility >= 70 ? palette.accent.acidGreen : palette.warn.amber,
                paddingLeft: 10,
                gap: 4,
              }}
            >
              <Text selectable style={{ color: palette.fg.primary, lineHeight: 20 }}>
                {item.headline}
              </Text>
              <Text
                selectable
                style={{
                  color: palette.fg.muted,
                  fontFamily: monoFamily,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {item.affectedTickers.join(" / ")} // credibility {item.credibility}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

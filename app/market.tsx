import * as React from "react";
import { View, ScrollView } from "react-native";
import CommodityRow from "@/components/commodity-row";
import { DEMO_COMMODITIES } from "@/engine/demo-market";
import { useRouter } from "expo-router";
import { terminalColors } from "@/theme/terminal";

export default function MarketScreen() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Simulate async data fetch for market data
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = (ticker: string) => {
    setSelected(ticker);
    router.push({ pathname: "/terminal", params: { ticker } });
  };

  // Show placeholder rows while loading to maintain layout continuity
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: terminalColors.background }}>
        <ScrollView>
          {Array.from({ length: 5 }).map((_, i) => (
            <CommodityRow
              key={`placeholder-${i}`}
              ticker="---"
              name="Loading..."
              price={0}
              changePercent={0}
              loading={true}
              isSelected={false}
              onPress={() => {}}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: terminalColors.background }}>
      <ScrollView>
        {DEMO_COMMODITIES.map((c) => (
          <CommodityRow
            key={c.ticker}
            ticker={c.ticker}
            name={c.name}
            price={c.basePrice}
            changePercent={0}
            isSelected={selected === c.ticker}
            onPress={() => handlePress(c.ticker)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Removed duplicate default export that caused a naming conflict.


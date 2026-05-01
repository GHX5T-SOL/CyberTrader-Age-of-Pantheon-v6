import * as React from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import CommodityRow from "@/components/commodity-row";
import { PRESENTATION_DIRECTION } from "@/data/presentation-direction";
import { useRouter } from "expo-router";

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
    // navigate to terminal for trading this commodity
    router.push({ pathname: "/terminal", params: { commodity: ticker } });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00ff99" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <ScrollView>
        {PRESENTATION_DIRECTION.map((c) => (
          <CommodityRow
            key={c.ticker}
            ticker={c.ticker}
            name={c.name}
            price={c.price}
            changePercent={c.changePercent}
            isSelected={selected === c.ticker}
            onPress={() => handlePress(c.ticker)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Removed duplicate default export that caused a naming conflict.


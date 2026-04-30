import * as React from "react";
import { View, ScrollView } from "react-native";
import CommodityRow from "@/components/commodity-row";
import { PRESENTATION_DIRECTION } from "@/data/presentation-direction";
import { useRouter } from "expo-router";

export default function MarketScreen() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);

  const handlePress = (ticker: string) => {
    setSelected(ticker);
    // navigate to terminal for trading this commodity
    router.push({ pathname: "/terminal", params: { commodity: ticker } });
  };

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


export default function MarketRoute() {
  return <Redirect href="/terminal" />;
}

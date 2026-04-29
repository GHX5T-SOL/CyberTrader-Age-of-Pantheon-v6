import { Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function MarketTapeHeader() {
  const labelStyle = {
    fontFamily: terminalFont,
    color: terminalColors.dim,
    fontSize: 8,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  };

  return (
    <View
      style={{
        minHeight: 24,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: terminalColors.borderDim,
        backgroundColor: terminalColors.background,
        paddingHorizontal: 8,
      }}
    >
      <Text style={[labelStyle, { width: 36 }]}>ICON</Text>
      <Text style={[labelStyle, { width: 52 }]}>ID</Text>
      <Text style={[labelStyle, { flex: 1 }]}>ASSET_NAME</Text>
      <Text style={[labelStyle, { width: 86, textAlign: "right" }]}>PRICE</Text>
      <Text style={[labelStyle, { width: 62, textAlign: "right" }]}>DELTA</Text>
    </View>
  );
}

export { MarketTapeHeader };

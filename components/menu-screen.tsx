import * as React from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface MenuScreenProps {
  title: string;
  children: React.ReactNode;
}

export default function MenuScreen({ title, children }: MenuScreenProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ minHeight: "100%", padding: 16, backgroundColor: terminalColors.background }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 8, paddingRight: 14 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{"\u2190"} BACK</Text>
        </Pressable>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 14, flex: 1, textAlign: "right" }}>
          {title}
        </Text>
      </View>
      {children}
    </ScrollView>
  );
}


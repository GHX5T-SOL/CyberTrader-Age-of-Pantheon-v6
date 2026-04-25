import * as React from "react";
import { router } from "expo-router";
import { BackHandler, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useDemoRouteGuard } from "@/hooks/use-demo-route-guard";
import { getMenuBackFallbackHref, type DemoHref } from "@/state/demo-routes";
import { useDemoStore } from "@/state/demo-store";
import RouteRecoveryScreen from "@/components/route-recovery-screen";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface MenuScreenProps {
  title: string;
  children: React.ReactNode;
}

function navigateBack(fallbackHref: DemoHref) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}

export default function MenuScreen({ title, children }: MenuScreenProps) {
  const routeReady = useDemoRouteGuard();
  const phase = useDemoStore((state) => state.phase);
  const playerId = useDemoStore((state) => state.playerId);
  const fallbackHref = getMenuBackFallbackHref({ phase, playerId });

  React.useEffect(() => {
    if (!routeReady || Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      navigateBack(fallbackHref);
      return true;
    });

    return () => subscription.remove();
  }, [fallbackHref, routeReady]);

  if (!routeReady) {
    return <RouteRecoveryScreen title="RECOVERING MENU ROUTE" />;
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ minHeight: "100%", padding: 16, backgroundColor: terminalColors.background }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
        <Pressable
          onPress={() => {
            navigateBack(fallbackHref);
          }}
          style={{ paddingVertical: 8, paddingRight: 14 }}
        >
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

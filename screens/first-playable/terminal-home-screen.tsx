import { Stack, useRouter } from "expo-router";
import { Text, View, useWindowDimensions } from "react-native";
import { DemoPhaseShell } from "@/components/demo-phase-shell";
import { PrimaryAction } from "@/components/primary-action";
import { ResourceChip } from "@/components/resource-chip";
import { SectionCard } from "@/components/section-card";
import { SignalCore } from "@/components/signal-core";
import { SystemLine } from "@/components/system-line";
import { useDemoMarketLoop } from "@/hooks/use-demo-market-loop";
import { formatObol } from "@/engine/demo-market";
import { FIRST_TRADE_HINT_TICKER } from "@/engine/demo-market";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function TerminalHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const handle = useDemoStore((state) => state.handle);
  const profile = useDemoStore((state) => state.profile);
  const tick = useDemoStore((state) => state.tick);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const resources = useDemoStore((state) => state.resources);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const isBusy = useDemoStore((state) => state.isBusy);
  const openMarket = useDemoStore((state) => state.openMarket);
  const resetDemo = useDemoStore((state) => state.resetDemo);

  useDemoMarketLoop();

  return (
    <DemoPhaseShell
      eyebrow="cybertrader // terminal home"
      title="Cockpit"
      description="Read the deck state at a glance, then route into S1LKROAD for your first live trade."
    >
      <Stack.Screen options={{ title: "Terminal" }} />
      <SectionCard
        eyebrow={`tick_${String(tick).padStart(4, "0")}`}
        title={handle}
        tone="cyan"
        right={
          <View
            style={{
              borderWidth: 1,
              borderColor: `${palette.accent.cyan}44`,
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Text
              selectable
              style={{
                color: palette.accent.cyan,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontFamily: monoFamily,
              }}
            >
              market live
            </Text>
          </View>
        }
      >
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          {systemMessage}
        </Text>
        <View
          style={{
            flexDirection: compact ? "column" : "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <ResourceChip label="0BOL" value={formatObol(balanceObol)} tone="cyan" />
          <ResourceChip label="OS" value={profile?.osTier ?? "PIRATE"} tone="cyan" />
          <ResourceChip
            label="Energy"
            value={`${Math.floor(resources.energySeconds / 3600)}h`}
            tone="acid"
          />
          <ResourceChip label="Heat" value={`${resources.heat}`} tone="heat" />
          <ResourceChip label="Tick" value={String(tick).padStart(4, "0")} tone="amber" />
        </View>
      </SectionCard>
      <SectionCard eyebrow="terminal_home" title="cockpit" tone="amber">
        <View style={{ gap: 14 }}>
          <SignalCore
            label="core status"
            detail="The Eidolon shard is stable enough to trade, but still running hot under containment."
            size="compact"
          />
          <Text selectable style={{ color: palette.fg.primary, lineHeight: 22 }}>
            The deck is stable enough to trade. Start with {FIRST_TRADE_HINT_TICKER} if
            you want a lower-heat first move. One profitable loop is the current demo
            target.
          </Text>
          <View style={{ gap: 6 }}>
            <SystemLine tone="muted">[sys] market open // 10 commodities visible</SystemLine>
            <SystemLine tone="muted">[sys] first objective // buy low-risk inventory</SystemLine>
            <SystemLine tone="muted">[sys] survive first trade with signal intact</SystemLine>
          </View>
          <PrimaryAction
            label="route to s1lkroad"
            tone="acid"
            disabled={isBusy}
            onPress={() => {
              openMarket();
              router.push("/market");
            }}
          />
        </View>
      </SectionCard>
      {firstTradeComplete ? (
        <SectionCard eyebrow="loop_status" title="first loop survived" tone="acid">
          <Text selectable style={{ color: palette.fg.primary, lineHeight: 22 }}>
            You woke up, claimed the deck, traded live inventory, and exited with a
            green result. That is the first real game loop now proven in routed form.
          </Text>
        </SectionCard>
      ) : null}
      <PrimaryAction
        label="reset demo"
        tone="heat"
        disabled={isBusy}
        onPress={() => {
          void resetDemo().then(() => {
            router.replace("/boot");
          });
        }}
      />
    </DemoPhaseShell>
  );
}

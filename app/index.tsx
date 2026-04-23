import * as React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  DEMO_COMMODITIES,
  FIRST_TRADE_HINT_TICKER,
  formatObol,
} from "@/engine/demo-market";
import { CommodityRow } from "@/components/commodity-row";
import { ResourceChip } from "@/components/resource-chip";
import { SectionCard } from "@/components/section-card";
import { SystemLine } from "@/components/system-line";
import { TradeTicket } from "@/components/trade-ticket";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export default function IndexScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 430;

  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);
  const handle = useDemoStore((state) => state.handle);
  const tick = useDemoStore((state) => state.tick);
  const prices = useDemoStore((state) => state.prices);
  const changes = useDemoStore((state) => state.changes);
  const resources = useDemoStore((state) => state.resources);
  const holdings = useDemoStore((state) => state.holdings);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const moveToHandle = useDemoStore((state) => state.moveToHandle);
  const submitHandle = useDemoStore((state) => state.submitHandle);
  const openMarket = useDemoStore((state) => state.openMarket);
  const goHome = useDemoStore((state) => state.goHome);
  const selectTicker = useDemoStore((state) => state.selectTicker);
  const advanceMarket = useDemoStore((state) => state.advanceMarket);
  const buySelected = useDemoStore((state) => state.buySelected);
  const sellSelected = useDemoStore((state) => state.sellSelected);
  const resetDemo = useDemoStore((state) => state.resetDemo);

  const [draftHandle, setDraftHandle] = React.useState(handle);

  React.useEffect(() => {
    setDraftHandle(handle);
  }, [handle]);

  React.useEffect(() => {
    if (phase !== "terminal") {
      return;
    }

    const interval = setInterval(() => {
      advanceMarket();
    }, 2600);

    return () => clearInterval(interval);
  }, [advanceMarket, phase]);

  const selectedCommodity = DEMO_COMMODITIES.find(
    (commodity) => commodity.ticker === selectedTicker,
  );
  const selectedHolding = holdings[selectedTicker];
  const selectedPrice = prices[selectedTicker];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: palette.bg.void }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40,
        gap: 18,
      }}
    >
      <View style={{ gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text
            selectable
            style={{
              color: palette.accent.cyan,
              fontSize: 12,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              fontFamily: monoFamily,
            }}
          >
            cybertrader // first playable slice
          </Text>
          <Text
            selectable
            style={{
              color: palette.fg.primary,
              fontSize: 30,
              fontWeight: "700",
            }}
          >
            Ag3nt_0S//pIRAT3
          </Text>
          <Text
            selectable
            style={{ color: palette.fg.muted, fontSize: 15, lineHeight: 22 }}
          >
            A playable first slice of the game: wake, claim a handle, scan the
            market, make one trade, and survive your first move.
          </Text>
        </View>

        {phase === "boot" ? (
          <>
            <SectionCard eyebrow="boot_sequence" title="wake signal" tone="cyan">
              <View style={{ gap: 6 }}>
                <SystemLine>
                  BIOS_0X3F...................... ok
                </SystemLine>
                <SystemLine>
                  rootfs mount /scratch.......... ok
                </SystemLine>
                <SystemLine>
                  signal integrity............... 78%
                </SystemLine>
                <SystemLine tone="amber">
                  eAgent cloak................... on (unstable)
                </SystemLine>
                <SystemLine tone="acid">
                  market uplink.................. live
                </SystemLine>
              </View>
            </SectionCard>

            <PrimaryAction
              label="unpack shard"
              tone="acid"
              onPress={moveToHandle}
            />
          </>
        ) : null}

        {phase === "handle" ? (
          <>
            <SectionCard eyebrow="local_shell" title="claim handle" tone="acid">
              <View style={{ gap: 10 }}>
                <SystemLine tone="acid">
                  [sys] you are awake. the deck is not yours.
                </SystemLine>
                <SystemLine tone="muted">
                  [sys] local shell only. uplink optional.
                </SystemLine>
                <TextInput
                  value={draftHandle}
                  onChangeText={setDraftHandle}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={16}
                  placeholder="enter_handle"
                  placeholderTextColor={palette.fg.muted}
                  style={{
                    borderWidth: 1,
                    borderColor: `${palette.accent.cyan}44`,
                    borderRadius: 18,
                    borderCurve: "continuous",
                    backgroundColor: palette.bg.deepGreenBlack,
                    color: palette.fg.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 17,
                    fontFamily: monoFamily,
                  }}
                />
              </View>
            </SectionCard>

            <PrimaryAction
              label="claim handle"
              tone="cyan"
              onPress={() => {
                submitHandle(draftHandle);
              }}
            />
          </>
        ) : null}

        {phase === "terminal" ? (
          <>
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
              <Text
                selectable
                style={{ color: palette.fg.muted, lineHeight: 22 }}
              >
                {systemMessage}
              </Text>
              <View
                style={{
                  flexDirection: compact ? "column" : "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <ResourceChip
                  label="0BOL"
                  value={formatObol(resources.balanceObol)}
                  tone="cyan"
                />
                <ResourceChip
                  label="Energy"
                  value={`${Math.floor(resources.energySeconds / 3600)}h`}
                  tone="acid"
                />
                <ResourceChip
                  label="Heat"
                  value={`${resources.heat}`}
                  tone="heat"
                />
                <ResourceChip
                  label="Tick"
                  value={String(tick).padStart(4, "0")}
                  tone="amber"
                />
              </View>
            </SectionCard>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <PrimaryAction
                label="terminal home"
                tone={activeView === "home" ? "acid" : "cyan"}
                onPress={goHome}
                compact
              />
              <PrimaryAction
                label="open market"
                tone={activeView === "market" ? "acid" : "cyan"}
                onPress={openMarket}
                compact
              />
            </View>

            {activeView === "home" ? (
              <SectionCard eyebrow="terminal_home" title="cockpit" tone="amber">
                <View style={{ gap: 10 }}>
                  <Text
                    selectable
                    style={{ color: palette.fg.primary, lineHeight: 22 }}
                  >
                    The deck is stable enough to trade. Start with{" "}
                    {FIRST_TRADE_HINT_TICKER} if you want a lower-heat first move.
                    One profitable loop is the current demo target.
                  </Text>
                  <View style={{ gap: 6 }}>
                    <SystemLine tone="muted">
                      [sys] market open // {DEMO_COMMODITIES.length} commodities
                      visible
                    </SystemLine>
                    <SystemLine tone="muted">
                      [sys] first objective // buy low-risk inventory
                    </SystemLine>
                    <SystemLine tone="muted">
                      [sys] survive first trade with signal intact
                    </SystemLine>
                  </View>
                  <PrimaryAction
                    label="route to s1lkroad"
                    tone="acid"
                    onPress={openMarket}
                  />
                </View>
              </SectionCard>
            ) : null}

            {activeView === "market" ? (
              <>
                <SectionCard eyebrow="s1lkroad_4.0" title="market scan" tone="cyan">
                  <Text
                    selectable
                    style={{ color: palette.fg.muted, lineHeight: 22 }}
                  >
                    Ticker first. Name second. Read the delta. Small trades keep
                    Heat under control.
                  </Text>
                  <View style={{ gap: 10 }}>
                    {DEMO_COMMODITIES.map((commodity) => (
                      <CommodityRow
                        key={commodity.ticker}
                        commodity={commodity}
                        price={prices[commodity.ticker] ?? commodity.basePrice}
                        change={changes[commodity.ticker] ?? 0}
                        ownedQuantity={holdings[commodity.ticker]?.quantity}
                        selected={commodity.ticker === selectedTicker}
                        compact={compact}
                        onPress={() => {
                          selectTicker(commodity.ticker);
                        }}
                      />
                    ))}
                  </View>
                </SectionCard>

                <TradeTicket
                  commodity={selectedCommodity}
                  price={selectedPrice}
                  holding={selectedHolding}
                  canSell={Boolean(selectedHolding)}
                  onBuy={buySelected}
                  onSell={sellSelected}
                />
              </>
            ) : null}

            {firstTradeComplete ? (
              <SectionCard
                eyebrow="loop_status"
                title="first loop survived"
                tone="acid"
              >
                <Text
                  selectable
                  style={{ color: palette.fg.primary, lineHeight: 22 }}
                >
                  You woke up, claimed the deck, traded live inventory, and
                  exited with a green result. That is the first real game loop
                  now proven in UI form.
                </Text>
              </SectionCard>
            ) : null}

            <PrimaryAction label="reset demo" tone="heat" onPress={resetDemo} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function PrimaryAction({
  label,
  tone,
  compact = false,
  onPress,
}: {
  label: string;
  tone: "cyan" | "acid" | "heat";
  compact?: boolean;
  onPress: () => void;
}) {
  const color =
    tone === "acid"
      ? palette.accent.acidGreen
      : tone === "heat"
        ? palette.danger.heat
        : palette.accent.cyan;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: compact ? 1 : undefined,
        alignItems: "center",
        borderWidth: 1,
        borderColor: `${color}55`,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: `${color}12`,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        selectable
        style={{
          color,
          fontSize: 13,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1.3,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

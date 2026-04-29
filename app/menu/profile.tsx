import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { getLocation } from "@/data/locations";
import { formatObol } from "@/engine/demo-market";
import {
  AGENT_OS_UNLOCK_RANK,
  getFactionDefinition,
  getFactionStanding,
} from "@/engine/factions";
import { getFactionReputationForPressure } from "@/engine/terminal-pressure";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const SHARD_ASCII = [
  "   /\\   ",
  "  /##\\  ",
  " <####> ",
  "  \\##/  ",
  "   \\/   ",
  "  /__\\  ",
];

const TIER_LABEL: Record<"neutral" | "trusted" | "favored" | "legend", string> = {
  neutral: "NEUTRAL",
  trusted: "TRUSTED",
  favored: "FAVORED",
  legend: "LEGEND",
};

function formatHeatLabel(heat: number): string {
  const safe = Math.max(0, Math.round(heat));
  if (safe >= 75) return `${safe} // PRIORITY`;
  if (safe >= 50) return `${safe} // ELEVATED`;
  if (safe >= 25) return `${safe} // WATCH`;
  return `${safe} // CLEAR`;
}

function formatEnergyHours(seconds: number): string {
  const hours = Math.max(0, Math.floor(seconds / 3600));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainder = hours % 24;
    return `${days}d ${remainder.toString().padStart(2, "0")}h`;
  }
  return `${hours}h`;
}

function formatLocator(playerId: string | null, handle: string): string {
  const source = playerId ?? handle ?? "LOCAL";
  const cleaned = source.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (cleaned.length === 0) return "LOCAL-0000";
  return `${cleaned.slice(0, 4).padEnd(4, "0")}-${cleaned.slice(-4).padStart(4, "0")}`;
}

export default function ProfileMenuRoute() {
  const handle = useDemoStore((state) => state.handle);
  const playerId = useDemoStore((state) => state.playerId);
  const profile = useDemoStore((state) => state.profile);
  const positions = useDemoStore((state) => state.positions);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const resources = useDemoStore((state) => state.resources);
  const progression = useDemoStore((state) => state.progression);
  const factionChoice = useDemoStore((state) => state.factionChoice);
  const npcReputation = useDemoStore((state) => state.npcReputation);
  const world = useDemoStore((state) => state.world);

  const totalPnl = Object.values(positions).reduce(
    (total, item) => total + item.unrealizedPnl + item.realizedPnl,
    0,
  );

  const xpFloor = progression.xpRequired;
  const xpCeil = progression.nextXpRequired;
  const span = xpCeil !== null ? Math.max(1, xpCeil - xpFloor) : 1;
  const into = Math.max(0, progression.xp - xpFloor);
  const xpPercent = xpCeil === null ? 100 : Math.min(100, (into / span) * 100);
  const xpRemaining = xpCeil === null ? null : Math.max(0, xpCeil - progression.xp);

  const rankUnlockDelta = AGENT_OS_UNLOCK_RANK - progression.level;
  const agentOsUnlocked = progression.level >= AGENT_OS_UNLOCK_RANK;

  const faction = factionChoice?.faction ?? null;
  const definition = faction ? getFactionDefinition(faction) : null;
  const reputation = faction
    ? getFactionReputationForPressure({ faction, npcReputation })
    : 0;
  const standing = faction ? getFactionStanding(faction, reputation) : null;

  const location = getLocation(world.currentLocationId);
  const handleLabel = handle && handle.length > 0 ? handle : "UNCLAIMED";
  const locator = formatLocator(playerId, handleLabel);
  const osTier = profile?.osTier ?? "PIRATE";
  const walletLabel = profile?.walletAddress
    ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`
    : "LOCAL DEV IDENTITY";
  const createdLabel = profile?.createdAt ?? "LOCAL SESSION";

  const onOpenProgression = React.useCallback(() => {
    router.replace("/menu/progression");
  }, []);
  const onOpenMissions = React.useCallback(() => {
    router.replace("/missions");
  }, []);

  return (
    <MenuScreen title="EIDOLON PROFILE">
      <NeonBorder active>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: terminalFont,
              color: terminalColors.cyan,
              fontSize: 12,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            RANK {progression.level} // {progression.title}
          </Text>
          <Text
            style={{
              fontFamily: terminalFont,
              color: terminalColors.amber,
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            OS TIER {osTier}
          </Text>
        </View>

        <Text
          style={{
            marginTop: 6,
            fontFamily: terminalFont,
            color: terminalColors.text,
            fontSize: 12,
          }}
        >
          HANDLE: {handleLabel}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 9,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          ID // {locator} // {location.name.toUpperCase()}
        </Text>

        <View
          style={{
            height: 6,
            backgroundColor: terminalColors.borderDim,
            marginTop: 10,
          }}
        >
          <View
            style={{
              height: 6,
              width: `${xpPercent}%`,
              backgroundColor: terminalColors.cyan,
            }}
          />
        </View>
        <Text
          style={{
            marginTop: 6,
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          XP {progression.xp.toLocaleString()}
          {xpCeil === null
            ? " // MAX RANK"
            : ` / ${xpCeil.toLocaleString()} // NEXT IN ${xpRemaining!.toLocaleString()} XP`}
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: terminalColors.cyan,
              backgroundColor: terminalColors.cyanFill,
              padding: 12,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, paddingRight: 8, gap: 6 }}>
                <Text
                  style={{
                    fontFamily: terminalFont,
                    color: terminalColors.muted,
                    fontSize: 9,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  AGENT TELEMETRY
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    LIQUID BALANCE
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.cyan,
                      fontSize: 11,
                    }}
                  >
                    {formatObol(balanceObol)} 0BOL
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    TOTAL PNL
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color:
                        totalPnl >= 0
                          ? terminalColors.green
                          : terminalColors.red,
                      fontSize: 11,
                    }}
                  >
                    {totalPnl >= 0 ? "+" : ""}
                    {totalPnl.toFixed(2)} 0BOL
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    HEAT
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color:
                        resources.heat >= 50
                          ? terminalColors.amber
                          : terminalColors.text,
                      fontSize: 11,
                    }}
                  >
                    {formatHeatLabel(resources.heat)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    ENERGY
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.text,
                      fontSize: 11,
                    }}
                  >
                    {formatEnergyHours(resources.energySeconds)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    BAY
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.text,
                      fontSize: 11,
                    }}
                  >
                    {Object.keys(positions).length}/{progression.inventorySlots} BERTHS
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {SHARD_ASCII.map((line, index) => (
                  <Text
                    key={`shard-${index}`}
                    style={{
                      fontFamily: terminalFont,
                      color:
                        index === 0 || index === SHARD_ASCII.length - 1
                          ? terminalColors.cyan
                          : terminalColors.muted,
                      fontSize: 10,
                      lineHeight: 12,
                    }}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: terminalColors.amber,
              backgroundColor: "rgba(255,184,0,0.06)",
              padding: 12,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.muted,
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              AGENTOS DOSSIER
            </Text>
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.amber,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              {definition
                ? `FACTION // ${definition.name.toUpperCase()}`
                : "FACTION // UNAFFILIATED"}
            </Text>
            {definition ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.muted,
                      fontSize: 10,
                    }}
                  >
                    STANDING
                  </Text>
                  <Text
                    style={{
                      fontFamily: terminalFont,
                      color: terminalColors.text,
                      fontSize: 11,
                    }}
                  >
                    {TIER_LABEL[standing!.tier]} // REP {standing!.reputation}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: terminalFont,
                    color: terminalColors.text,
                    fontSize: 11,
                    lineHeight: 15,
                  }}
                  numberOfLines={3}
                >
                  {definition.ethos}
                </Text>
              </>
            ) : (
              <Text
                style={{
                  fontFamily: terminalFont,
                  color: terminalColors.text,
                  fontSize: 11,
                  lineHeight: 15,
                }}
              >
                {agentOsUnlocked
                  ? "AgentOS unlocked. Pick a faction to unlock contract chains and route pressure."
                  : `AgentOS unlocks at rank ${AGENT_OS_UNLOCK_RANK}. ${
                      rankUnlockDelta > 0
                        ? `${rankUnlockDelta} rank${rankUnlockDelta === 1 ? "" : "s"} to go.`
                        : "Choose alignment when ready."
                    }`}
              </Text>
            )}

            <Pressable
              onPress={definition ? onOpenMissions : onOpenProgression}
              hitSlop={6}
              style={({ pressed }) => ({
                marginTop: 4,
                minHeight: 48,
                borderWidth: 1,
                borderColor: pressed ? terminalColors.text : terminalColors.amber,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
                backgroundColor: pressed
                  ? "rgba(255,184,0,0.18)"
                  : terminalColors.background,
              })}
            >
              {({ pressed }) => (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{
                    fontFamily: terminalFont,
                    color: pressed ? terminalColors.text : terminalColors.amber,
                    fontSize: 12,
                    fontWeight: "700",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {definition ? "[ OPEN AGENTOS BOARD ]" : "[ OPEN PROGRESSION ]"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </NeonBorder>

      <View style={{ marginTop: 14 }}>
        <NeonBorder active={false}>
          <Text
            style={{
              fontFamily: terminalFont,
              color: terminalColors.muted,
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            SESSION ANCHOR
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.muted,
                fontSize: 10,
              }}
            >
              WALLET
            </Text>
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.text,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {walletLabel}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.muted,
                fontSize: 10,
              }}
            >
              CREATED
            </Text>
            <Text
              style={{
                fontFamily: terminalFont,
                color: terminalColors.text,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {createdLabel}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 6,
              fontFamily: terminalFont,
              color: terminalColors.muted,
              fontSize: 9,
              lineHeight: 13,
            }}
          >
            Local-mode profile // store-safe // 0BOL is in-game currency only.
          </Text>
        </NeonBorder>
      </View>
    </MenuScreen>
  );
}

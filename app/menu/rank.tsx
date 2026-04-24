import { Text } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function RankMenuRoute() {
  const handle = useDemoStore((state) => state.handle) || "ZORO";
  const rank = useDemoStore((state) => state.profile?.rank ?? 1);
  const table = `┌─────┬──────────────────┬──────┬──────────┐
│ RANK│ EIDOLON          │ LVL  │ PNL      │
├─────┼──────────────────┼──────┼──────────┤
│  1  │ NULL_PTR         │  12  │ 4.2M     │
│  2  │ SHARD_7          │  10  │ 3.1M     │
│  3  │ MAE_GHOST        │   9  │ 2.6M     │
│  4  │ BLACKWAKE        │   8  │ 1.8M     │
│  5  │ ROOT_KID         │   7  │ 1.2M     │
│  6  │ ORACLE_DUST      │   6  │ 845K     │
│  7  │ HELIX_RAT        │   5  │ 410K     │
│  8  │ VOID_MERC        │   4  │ 288K     │
│  9  │ NEON_ASH         │   3  │ 180K     │
│ 10  │ ${handle.padEnd(16).slice(0, 16)} │  ${String(rank).padStart(2)}  │ 125K     │
└─────┴──────────────────┴──────┴──────────┘`;

  return (
    <MenuScreen title="RANK & STANDINGS">
      <NeonBorder active>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>YOUR RANK CARD</Text>
        <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>TITLE: PIRATE SHARD // LEVEL {rank} // XP {rank * 125}</Text>
      </NeonBorder>
      <Text style={{ marginTop: 16, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>{table}</Text>
    </MenuScreen>
  );
}


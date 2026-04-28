import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { terminalColors, terminalFont } from "@/theme/terminal";

const SECTIONS = [
  ["WELCOME, EIDOLON.", "You are a surviving shard of Pantheon running on a pirated cyberdeck. Your first job is to stay awake, trade carefully, and grow enough signal to unlock deeper systems."],
  ["GETTING STARTED", "Boot, claim a local handle, enter S1LKROAD, buy VBLM x15, wait for green tape, then sell the same lot. The first playable loop is one clean local trade."],
  ["ENERGY", "Energy is your awake time. Trading consumes it. Buy energy with 0BOL before the shell becomes unstable."],
  ["HEAT", "Heat is eAgent attention. High heat blocks risky actions and threatens later AgentOS systems."],
  ["TRADING", "Commodities move on deterministic ticks. VBLM/MTRX are safe cycle cargo, PGAS/ORRS/SNPS are the first upgrade lane, and contraband waits until Heat is controlled."],
  ["RANK", "Profitable trading earns XP. Rank unlocks OS tiers, rewards, and future multiplayer systems."],
  ["GLOSSARY", "0BOL: local game currency. $OBOL: optional Solana token layer. Eidolon: player shard. S1LKROAD: dark-market terminal."],
];

export default function HelpMenuRoute() {
  return (
    <MenuScreen title="HELP TERMINAL">
      <NeonBorder active>
        {SECTIONS.map(([title, body]) => (
          <View key={title} style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>{title}</Text>
            <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>{body}</Text>
          </View>
        ))}
      </NeonBorder>
    </MenuScreen>
  );
}

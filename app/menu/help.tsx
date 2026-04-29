import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { terminalColors, terminalFont } from "@/theme/terminal";

const SECTIONS = [
  ["WELCOME, EIDOLON.", "You are a surviving Pantheon shard running a local, fictional cyberdeck loop. Stay awake, keep Heat controlled, and bank enough signal to unlock deeper systems."],
  ["GETTING STARTED", "Claim a local handle, enter S1LKROAD, select VBLM, keep the lot at x15, tap EXECUTE, wait for green tape, then switch to SELL and close the same lot."],
  ["ENERGY", "Energy is your awake timer. Trades spend it. Recharge with 0BOL before the shell fades."],
  ["HEAT", "Heat is eAgent attention. Keep it low while learning; high Heat locks routes, raises raid risk, and slows AgentOS progress."],
  ["TRADING", "Commodities move on deterministic ticks. VBLM/MTRX are safe cycle cargo, PGAS/ORRS/SNPS are the first upgrade lane, and contraband waits until Heat is calm."],
  ["RANK", "Profitable local trades earn XP. Rank unlocks OS tiers, rewards, faction systems, and future multiplayer shells."],
  ["GLOSSARY", "0BOL: fictional local game currency. $OBOL: optional token layer, disabled unless explicitly enabled. Eidolon: player shard. S1LKROAD: dark-market terminal."],
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

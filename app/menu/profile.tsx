import { Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const SHARD = String.raw`
   /\ 
  /##\
 <####>
  \##/
   \/
  /__\
`;

export default function ProfileMenuRoute() {
  const handle = useDemoStore((state) => state.handle);
  const profile = useDemoStore((state) => state.profile);
  const positions = useDemoStore((state) => state.positions);
  const balance = useDemoStore((state) => state.balanceObol);
  const pnl = Object.values(positions).reduce((total, item) => total + item.unrealizedPnl + item.realizedPnl, 0);

  return (
    <MenuScreen title="EIDOLON PROFILE">
      <NeonBorder active>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>{SHARD}</Text>
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 12 }}>HANDLE: {handle || "UNCLAIMED"}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>WALLET: {profile?.walletAddress ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : "LOCAL DEV IDENTITY"}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>OS TIER: {profile?.osTier ?? "PIRATE"}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 12 }}>RANK: {profile?.rank ?? 1}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>FACTION: {profile?.faction ?? "UNAFFILIATED"}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>CREATED: {profile?.createdAt ?? "LOCAL SESSION"}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 12 }}>TOTAL PNL: {pnl.toFixed(2)} 0BOL</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>LIQUID BALANCE: {balance.toFixed(0)} 0BOL</Text>
        </View>
      </NeonBorder>
    </MenuScreen>
  );
}


import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import ConfirmModal from "@/components/confirm-modal";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import SystemStatePanel from "@/components/system-state-panel";
import { LAUNCH_ACCOUNT_RECOVERY_COPY } from "@/authority/launch-identity";
import { STORE_SAFE_BOUNDARY_POLICY } from "@/authority/store-safety";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function SettingsMenuRoute() {
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const resetTutorial = useDemoStore((state) => state.resetTutorial);
  const resetIntro = useDemoStore((state) => state.resetIntro);
  const [confirm, setConfirm] = React.useState(false);

  return (
    <MenuScreen title="SETTINGS">
      <NeonBorder active style={{ gap: 12 }}>
        <ActionButton
          variant="primary"
          label="[ REPLAY INTRO ]"
          onPress={() => {
            resetIntro();
            router.replace("/intro");
          }}
        />
        <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>AUDIO: DISABLED UNTIL SOUND PACK IS FINAL</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>HAPTICS: ENABLED BY ACTION BUTTONS</Text>
        <Pressable onPress={resetTutorial} style={{ borderWidth: 1, borderColor: terminalColors.borderDim, padding: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>RESET TUTORIAL</Text>
        </Pressable>
        <Pressable onPress={() => setConfirm(true)} style={{ borderWidth: 1, borderColor: terminalColors.red, padding: 12 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>CLEAR LOCAL DATA</Text>
        </Pressable>
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>FEATURE FLAGS</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>SUPABASE AUTHORITY: OFF</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11 }}>SOLANA TOKEN MODE: DISABLED FOR LAUNCH</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>{STORE_SAFE_BOUNDARY_POLICY.walletScope}</Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>APP VERSION: v0.1.3</Text>
        </View>
        <SystemStatePanel
          kind="offline"
          framed={false}
          compact
          title={LAUNCH_ACCOUNT_RECOVERY_COPY.settingsTitle}
          message={LAUNCH_ACCOUNT_RECOVERY_COPY.settingsMessage}
          detail={LAUNCH_ACCOUNT_RECOVERY_COPY.settingsDetail}
        />
      </NeonBorder>
      <ConfirmModal
        visible={confirm}
        message="CLEAR LOCAL DEMO DATA?"
        onConfirm={() => {
          setConfirm(false);
          void resetDemo().then(() => router.replace("/intro"));
        }}
        onCancel={() => setConfirm(false)}
      />
    </MenuScreen>
  );
}

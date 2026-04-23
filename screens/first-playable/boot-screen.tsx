import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { DemoPhaseShell } from "@/components/demo-phase-shell";
import { PrimaryAction } from "@/components/primary-action";
import { SectionCard } from "@/components/section-card";
import { SignalCore } from "@/components/signal-core";
import { SystemLine } from "@/components/system-line";
import { useDemoStore } from "@/state/demo-store";

export function BootScreen() {
  const router = useRouter();
  const isBusy = useDemoStore((state) => state.isBusy);
  const moveToHandle = useDemoStore((state) => state.moveToHandle);

  return (
    <DemoPhaseShell
      eyebrow="cybertrader // first playable slice"
      title="Ag3nt_0S//pIRAT3"
      description="Wake inside a damaged cyberdeck, stabilize the shell, and move into the local terminal."
    >
      <Stack.Screen options={{ title: "Boot" }} />
      <SignalCore
        label="eidolon shard // waking"
        detail="A broken intelligence fragment is stabilizing inside stolen hardware."
      />
      <SectionCard eyebrow="boot_sequence" title="wake signal" tone="cyan">
        <View style={{ gap: 6 }}>
          <SystemLine>BIOS_0X3F...................... ok</SystemLine>
          <SystemLine>rootfs mount /scratch.......... ok</SystemLine>
          <SystemLine>signal integrity............... 78%</SystemLine>
          <SystemLine tone="amber">eAgent cloak................... on (unstable)</SystemLine>
          <SystemLine tone="acid">market uplink.................. live</SystemLine>
        </View>
      </SectionCard>
      <PrimaryAction
        label="unpack shard"
        tone="acid"
        disabled={isBusy}
        onPress={() => {
          moveToHandle();
          router.replace("/handle");
        }}
      />
    </DemoPhaseShell>
  );
}

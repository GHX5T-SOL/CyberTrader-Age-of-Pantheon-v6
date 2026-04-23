import { Text, View } from "react-native";
import { DemoPhaseShell } from "@/components/demo-phase-shell";
import { SectionCard } from "@/components/section-card";
import { SignalCore } from "@/components/signal-core";
import { SystemLine } from "@/components/system-line";
import { palette } from "@/theme/colors";

export function HydrationScreen() {
  return (
    <DemoPhaseShell
      eyebrow="cybertrader // system resume"
      title="Ag3nt_0S//pIRAT3"
      description="Reloading the local shard and stitching authority state back into the terminal."
    >
      <SignalCore
        label="resume lattice"
        detail="Shard memory, price cache, and local authority state are being re-bound."
        size="compact"
      />
      <SectionCard eyebrow="resume_state" title="restoring session" tone="cyan">
        <View style={{ gap: 6 }}>
          <SystemLine>memory lattice................. syncing</SystemLine>
          <SystemLine>price cache.................... syncing</SystemLine>
          <SystemLine tone="acid">local authority................ live</SystemLine>
        </View>
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          The first playable slice now persists locally so you can reopen the
          demo without losing the trade state.
        </Text>
      </SectionCard>
    </DemoPhaseShell>
  );
}

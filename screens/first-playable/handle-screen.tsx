import * as React from "react";
import { Stack, useRouter } from "expo-router";
import { TextInput, View } from "react-native";
import { DemoPhaseShell } from "@/components/demo-phase-shell";
import { PrimaryAction } from "@/components/primary-action";
import { SectionCard } from "@/components/section-card";
import { SystemLine } from "@/components/system-line";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function HandleScreen() {
  const router = useRouter();
  const handle = useDemoStore((state) => state.handle);
  const isBusy = useDemoStore((state) => state.isBusy);
  const submitHandle = useDemoStore((state) => state.submitHandle);
  const [draftHandle, setDraftHandle] = React.useState(handle);

  React.useEffect(() => {
    setDraftHandle(handle);
  }, [handle]);

  return (
    <DemoPhaseShell
      eyebrow="cybertrader // local shell"
      title="Claim A Handle"
      description="Lock a local alias before entering the market. This is identity bootstrapping, not account signup."
    >
      <Stack.Screen options={{ title: "Handle" }} />
      <SectionCard eyebrow="local_shell" title="claim handle" tone="acid">
        <View style={{ gap: 10 }}>
          <SystemLine tone="acid">[sys] you are awake. the deck is not yours.</SystemLine>
          <SystemLine tone="muted">[sys] local shell only. uplink optional.</SystemLine>
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
        label={isBusy ? "claiming..." : "claim handle"}
        tone="cyan"
        disabled={isBusy}
        onPress={() => {
          void submitHandle(draftHandle).then((success) => {
            if (success) {
              router.replace("/terminal");
            }
          });
        }}
      />
    </DemoPhaseShell>
  );
}

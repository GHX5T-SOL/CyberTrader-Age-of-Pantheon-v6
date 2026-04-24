import * as React from "react";
import { router } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import NeonBorder from "@/components/neon-border";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const STEPS = [
  "YOU ARE AN EIDOLON - A SHARD OF THE SHATTERED PANTHEON AI. THIS IS YOUR CYBERDECK.",
  "ENERGY KEEPS YOU AWAKE. IT DRAINS IN REAL TIME.",
  "HEAT ATTRACTS eAGENTS. HIGH HEAT = DANGER.",
  "0BOL IS YOUR TRADING CURRENCY. YOU START WITH 1,000,000.",
  "ENTER S1LKROAD TO TRADE COMMODITIES.",
  "MAKE PROFITABLE TRADES TO EARN XP AND RANK UP.",
  "YOU ARE NOW READY. ENTER S1LKROAD AND MAKE YOUR FIRST TRADE.",
];

export default function TutorialRoute() {
  useDemoBootstrap();
  const completeTutorial = useDemoStore((state) => state.completeTutorial);
  const tutorialCompleted = useDemoStore((state) => state.tutorialCompleted);
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (tutorialCompleted) {
      router.replace("/home");
    }
  }, [tutorialCompleted]);

  const complete = () => {
    completeTutorial();
    router.replace("/home");
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 }}>
        <NeonBorder active style={{ alignSelf: "center", width: "100%", maxWidth: 360 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 10, marginBottom: 12 }}>
            TUTORIAL STEP {step + 1}/7
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 15, lineHeight: 23 }}>{STEPS[step]}</Text>
          {step === 6 ? (
            <View style={{ marginTop: 18 }}>
              <ActionButton variant="primary" label="[ ENTER ]" glowing onPress={complete} />
            </View>
          ) : null}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 }}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  backgroundColor: index === step ? terminalColors.cyan : terminalColors.border,
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
            <Pressable disabled={step === 0} onPress={() => setStep((value) => Math.max(0, value - 1))} style={{ opacity: step === 0 ? 0.35 : 1, padding: 8 }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>[&lt; BACK]</Text>
            </Pressable>
            <Pressable onPress={() => (step === STEPS.length - 1 ? complete() : setStep((value) => value + 1))} style={{ padding: 8 }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>[NEXT &gt;]</Text>
            </Pressable>
          </View>
        </NeonBorder>
      </View>
    </Modal>
  );
}


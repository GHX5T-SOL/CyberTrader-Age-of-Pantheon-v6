import { Modal, Pressable, Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface ConfirmModalProps {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  message,
  confirmLabel = "CONFIRM",
  cancelLabel = "CANCEL",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: terminalColors.modalBackdrop,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 300,
            borderWidth: 1,
            borderColor: terminalColors.cyan,
            backgroundColor: terminalColors.panel,
            padding: 20,
          }}
        >
          <Text style={{ fontFamily: terminalFont, fontSize: 14, color: terminalColors.text, marginBottom: 16, lineHeight: 20 }}>
            {message}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={onConfirm}>
              <Text style={{ fontFamily: terminalFont, fontSize: 14, color: terminalColors.green }}>
                [Y] {confirmLabel}
              </Text>
            </Pressable>
            <Text style={{ fontFamily: terminalFont, fontSize: 14, color: terminalColors.border }}>
              |
            </Text>
            <Pressable onPress={onCancel}>
              <Text style={{ fontFamily: terminalFont, fontSize: 14, color: terminalColors.red }}>
                [N] {cancelLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export { ConfirmModal };


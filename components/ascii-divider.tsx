import { Text } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface AsciiDividerProps {
  label?: string;
}

export default function AsciiDivider({ label }: AsciiDividerProps) {
  const content = label ? `──────── ${label} ────────` : "─────────────────────────────";
  return (
    <Text
      style={{
        fontFamily: terminalFont,
        fontSize: 10,
        color: terminalColors.border,
        textAlign: "center",
        marginVertical: 8,
      }}
    >
      {content}
    </Text>
  );
}

export { AsciiDivider };


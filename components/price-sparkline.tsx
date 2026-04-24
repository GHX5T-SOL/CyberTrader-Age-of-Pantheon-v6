import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { palette } from "@/theme/colors";

interface PriceSparklineProps {
  values: number[];
  tone?: "cyan" | "acid" | "heat";
}

const TONES = {
  cyan: palette.accent.cyan,
  acid: palette.accent.acidGreen,
  heat: palette.danger.heat,
} as const;

export function PriceSparkline({ values, tone = "cyan" }: PriceSparklineProps) {
  const samples = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const width = 160;
  const height = 46;
  const points = samples
    .map((value, index) => {
      const x = (index / Math.max(1, samples.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: `${TONES[tone]}30`,
        borderRadius: 12,
        backgroundColor: palette.bg.deepGreenBlack,
        padding: 8,
      }}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline
          points={points}
          fill="none"
          stroke={TONES[tone]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

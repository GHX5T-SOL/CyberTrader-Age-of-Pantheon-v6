import * as React from "react";
import { Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Line,
  Polyline,
  Rect,
  Stop,
} from "react-native-svg";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface ChartSparklineProps {
  data: number[];
  averageEntry?: number;
  height?: number;
  width?: number;
}

export default function ChartSparkline({
  data,
  averageEntry,
  height = 200,
  width,
}: ChartSparklineProps) {
  const [layoutWidth, setLayoutWidth] = React.useState(width ?? 0);
  const chartWidth = width ?? layoutWidth;

  if (data.length < 2) {
    return (
      <View
        onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
        style={{ height, width: "100%", alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted }}>
          INSUFFICIENT DATA
        </Text>
      </View>
    );
  }

  const minRaw = Math.min(...data, averageEntry ?? data[0] ?? 0);
  const maxRaw = Math.max(...data, averageEntry ?? data[0] ?? 0);
  const padding = Math.max(1, (maxRaw - minRaw) * 0.1);
  const min = minRaw - padding;
  const max = maxRaw + padding;
  const range = max - min || 1;
  const toY = (value: number) => height - ((value - min) / range) * height;
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(1, data.length - 1)) * Math.max(1, chartWidth);
      return `${x.toFixed(1)},${toY(value).toFixed(1)}`;
    })
    .join(" ");
  const fillPoints = `0,${height} ${points} ${Math.max(1, chartWidth)},${height}`;
  const averageY = averageEntry === undefined ? null : toY(averageEntry);

  return (
    <View
      onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
      style={{ height, width: "100%" }}
    >
      {chartWidth > 0 ? (
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={terminalColors.cyanFill} />
              <Stop offset="1" stopColor={terminalColors.cyanClear} />
            </LinearGradient>
          </Defs>
          <Polyline points={fillPoints} fill="url(#sparkFill)" stroke="none" />
          <Polyline
            points={points}
            fill="none"
            stroke={terminalColors.cyan}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {averageY !== null ? (
            <Line
              x1="0"
              y1={averageY}
              x2={chartWidth}
              y2={averageY}
              stroke={terminalColors.amber}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ) : null}
          <Rect x="0" y="0" width={chartWidth} height={height} fill="transparent" />
        </Svg>
      ) : null}
    </View>
  );
}

export { ChartSparkline };


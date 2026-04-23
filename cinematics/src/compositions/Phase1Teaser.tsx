import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const palette = {
  void: "#050608",
  terminal: "#0A0F0D",
  deep: "#07130E",
  primary: "#E8F0EE",
  muted: "#7B8B8A",
  cyan: "#00F5FF",
  acid: "#67FFB5",
  heat: "#FF2A4D",
  amber: "#FFB341",
};

const mono =
  '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace';
const display =
  '"Space Grotesk", "Geist", "Inter", system-ui, sans-serif';

export const Phase1Teaser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shardScale = spring({
    fps,
    frame,
    config: {
      damping: 14,
      stiffness: 70,
    },
  });

  const shardGlow = interpolate(frame, [0, 50, 120], [0.35, 0.9, 0.5], {
    extrapolateRight: "clamp",
  });

  const tapeReveal = interpolate(frame, [70, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const closeReveal = interpolate(frame, [130, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.void,
        color: palette.primary,
        overflow: "hidden",
        fontFamily: mono,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(0,245,255,0.13), transparent 34%), radial-gradient(circle at 50% 68%, rgba(103,255,181,0.12), transparent 42%)",
          opacity: 0.95,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 6px)",
          opacity: 0.1,
          transform: `translateY(${interpolate(frame, [0, 210], [0, 54])}px)`,
        }}
      />

      <Sequence from={0} durationInFrames={120}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 96,
            gap: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              transform: `scale(${0.84 + shardScale * 0.16})`,
            }}
          >
            <div
              style={{
                width: 420,
                height: 420,
                borderRadius: 48,
                border: `1px solid rgba(0,245,255,0.22)`,
                background: palette.deep,
                boxShadow: `0 0 90px rgba(0,245,255,${shardGlow}), inset 0 0 0 1px rgba(103,255,181,0.08)`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Img
                src={staticFile("eidolon_shard_core.png")}
                style={{
                  width: 340,
                  height: 340,
                  objectFit: "contain",
                  filter: `drop-shadow(0 0 30px rgba(0,245,255,${shardGlow}))`,
                }}
              />
            </div>
            <div
              style={{
                color: palette.cyan,
                fontSize: 26,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
              }}
            >
              Eidolon Shard
            </div>
            <div
              style={{
                maxWidth: 700,
                textAlign: "center",
                color: palette.muted,
                fontSize: 32,
                lineHeight: 1.4,
              }}
            >
              A dead intelligence wakes inside stolen hardware.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={70} durationInFrames={90}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            padding: "0 84px 120px",
          }}
        >
          <div
            style={{
              opacity: tapeReveal,
              transform: `translateY(${interpolate(tapeReveal, [0, 1], [36, 0])}px)`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            {[
              {
                src: "void_bloom.png",
                ticker: "VBLM",
                name: "Void Bloom",
                accent: palette.acid,
              },
              {
                src: "blacklight_serum.png",
                ticker: "BLCK",
                name: "Blacklight Serum",
                accent: palette.heat,
              },
            ].map((item) => (
              <div
                key={item.ticker}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  border: `1px solid ${item.accent}44`,
                  borderRadius: 30,
                  background: palette.terminal,
                  padding: 20,
                  boxShadow: `0 22px 44px rgba(0,0,0,0.3)`,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 24,
                    background: palette.deep,
                    border: `1px solid ${item.accent}33`,
                  }}
                >
                  <Img
                    src={staticFile(item.src)}
                    style={{ width: 92, height: 92, objectFit: "contain" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      color: item.accent,
                      fontSize: 24,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.ticker}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 42,
                      fontWeight: 700,
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ color: palette.muted, fontSize: 26 }}>
                    Buy. Hold. Sell. Survive the first loop.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={132} durationInFrames={78}>
        <AbsoluteFill
          style={{
            justifyContent: "space-between",
            padding: "112px 84px 100px",
          }}
        >
          <div
            style={{
              opacity: closeReveal,
              transform: `translateY(${interpolate(closeReveal, [0, 1], [24, 0])}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                color: palette.cyan,
                fontSize: 24,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              cybertrader // age of pantheon
            </div>
            <div
              style={{
                fontFamily: display,
                fontSize: 78,
                fontWeight: 700,
                lineHeight: 0.94,
                maxWidth: 820,
              }}
            >
              A working cyberdeck.
            </div>
          </div>

          <div
            style={{
              opacity: closeReveal,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {[
              "[boot] unstable shard // responsive",
              "[trade] deterministic first loop // live",
              "[target] app-store quality vertical slice",
            ].map((line, index) => (
              <div
                key={line}
                style={{
                  color: index === 1 ? palette.acid : palette.primary,
                  fontSize: 28,
                  letterSpacing: "0.08em",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

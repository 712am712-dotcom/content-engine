import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface MFDTradeTodayProps {
  hook: string;
  points: string[];
  cta: string;
  url: string;
}

const GOLD = "#F5C518";
const BG = "#0A0A0A";
const WHITE = "#FFFFFF";

function useSlideUp(frame: number, fps: number, delayFrames = 0) {
  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 18, stiffness: 200, mass: 0.6 },
    durationInFrames: 20,
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
  };
}

// ── Segment: Logo (0–90f) ───────────────────────────────────────────────────
function LogoSegment({ frame, fps }: { frame: number; fps: number }) {
  const logoStyle = useSlideUp(frame, fps, 10);
  const taglineStyle = useSlideUp(frame, fps, 25);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          width: interpolate(frame, [0, 30], [0, 120], { extrapolateRight: "clamp" }),
          height: 4,
          backgroundColor: GOLD,
          marginBottom: 12,
        }}
      />
      <div
        style={{
          ...logoStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 64,
          color: GOLD,
          letterSpacing: -2,
          lineHeight: 1,
        }}
      >
        MFD
      </div>
      <div
        style={{
          ...taglineStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 22,
          color: WHITE,
          opacity: (taglineStyle.opacity as number) * 0.7,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Markets for Dummies
      </div>
    </AbsoluteFill>
  );
}

// ── Segment: Hook (90–240f) ─────────────────────────────────────────────────
function HookSegment({
  frame,
  fps,
  hook,
}: {
  frame: number;
  fps: number;
  hook: string;
}) {
  const localFrame = frame - 90;
  const style = useSlideUp(localFrame, fps, 5);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 60px",
      }}
    >
      <div
        style={{
          ...style,
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 58,
          color: WHITE,
          lineHeight: 1.15,
          maxWidth: 900,
        }}
      >
        {hook}
      </div>
      {/* Gold underline accent */}
      <div
        style={{
          position: "absolute",
          bottom: "42%",
          left: 60,
          height: 5,
          backgroundColor: GOLD,
          width: interpolate(localFrame, [15, 45], [0, 200], {
            extrapolateRight: "clamp",
          }),
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Segment: Points (240–540f, one every 100f) ──────────────────────────────
function PointsSegment({
  frame,
  fps,
  points,
}: {
  frame: number;
  fps: number;
  points: string[];
}) {
  const localFrame = frame - 240;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 60px",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: GOLD,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 8,
          opacity: interpolate(localFrame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        The breakdown
      </div>
      {points.slice(0, 3).map((point, i) => {
        const delay = i * 100;
        const style = useSlideUp(localFrame, fps, delay + 5);
        return (
          <div
            key={i}
            style={{
              ...style,
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: GOLD,
                marginTop: 14,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 36,
                color: WHITE,
                lineHeight: 1.3,
              }}
            >
              {point}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ── Segment: The Trade (540–750f) ───────────────────────────────────────────
function TradeSegment({
  frame,
  fps,
  points,
}: {
  frame: number;
  fps: number;
  points: string[];
}) {
  const localFrame = frame - 540;
  const labelStyle = useSlideUp(localFrame, fps, 5);
  const textStyle = useSlideUp(localFrame, fps, 20);

  // Use last point as the key insight if available
  const insight = points[points.length - 1] ?? "";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 60px",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          ...labelStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: GOLD,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        The trade
      </div>
      <div
        style={{
          ...textStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 52,
          color: GOLD,
          lineHeight: 1.2,
        }}
      >
        {insight}
      </div>
    </AbsoluteFill>
  );
}

// ── Segment: CTA (750–900f) ─────────────────────────────────────────────────
function CTASegment({
  frame,
  fps,
  cta,
  url,
}: {
  frame: number;
  fps: number;
  cta: string;
  url: string;
}) {
  const localFrame = frame - 750;
  const bgOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ctaStyle = useSlideUp(localFrame, fps, 10);
  const urlStyle = useSlideUp(localFrame, fps, 25);
  const logoStyle = useSlideUp(localFrame, fps, 40);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Gold bg flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: GOLD,
          opacity: interpolate(localFrame, [0, 8, 16], [0, 0.08, 0], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          ...ctaStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 44,
          color: WHITE,
          textAlign: "center",
          padding: "0 40px",
          lineHeight: 1.2,
        }}
      >
        {cta}
      </div>
      <div
        style={{
          ...urlStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 28,
          color: GOLD,
        }}
      >
        {url}
      </div>
      <div
        style={{
          ...logoStyle,
          marginTop: 32,
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 32,
          color: GOLD,
          letterSpacing: -1,
        }}
      >
        MFD
      </div>
    </AbsoluteFill>
  );
}

// ── Main composition ─────────────────────────────────────────────────────────
export function MFDTradeToday({
  hook,
  points,
  cta,
  url,
}: MFDTradeTodayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const renderSegment = () => {
    if (frame < 90) return <LogoSegment frame={frame} fps={fps} />;
    if (frame < 240) return <HookSegment frame={frame} fps={fps} hook={hook} />;
    if (frame < 540) return <PointsSegment frame={frame} fps={fps} points={points} />;
    if (frame < 750) return <TradeSegment frame={frame} fps={fps} points={points} />;
    return <CTASegment frame={frame} fps={fps} cta={cta} url={url} />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {renderSegment()}
    </AbsoluteFill>
  );
}

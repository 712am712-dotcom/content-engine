import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { WordTiming } from "../../../lib/elevenlabs";
import { CaptionOverlay } from "../components/caption-overlay";
import { KenBurnsImage, KB_DIRECTIONS } from "../components/ken-burns-image";

export interface AESignalProps {
  hook: string;
  points: string[];
  takeaway?: string;
  cta?: string;
  audioSrc?: string;
  wordTimings?: WordTiming[];
  musicSrc?: string;
  slideImages?: string[];
}

const GREEN = "#00FF88";
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

// ── Frame constants ──────────────────────────────────────────────────────────
const LOGO_END     = 60;
const HOOK_END     = 120;
const POINTS_END   = 345;
const TAKEAWAY_END = 420;

// Slide [start, end] pairs for Ken Burns progress calculation
const SLIDE_RANGES: [number, number][] = [
  [0, LOGO_END],
  [LOGO_END, HOOK_END],
  [HOOK_END, POINTS_END],
  [POINTS_END, TAKEAWAY_END],
  [TAKEAWAY_END, 510],
];

// ── Segment: Logo (0–60f) ───────────────────────────────────────────────────
function LogoSegment({ frame, fps }: { frame: number; fps: number }) {
  const logoStyle = useSlideUp(frame, fps, 10);
  const taglineStyle = useSlideUp(frame, fps, 25);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          width: interpolate(frame, [0, 30], [0, 120], { extrapolateRight: "clamp" }),
          height: 4,
          backgroundColor: GREEN,
          marginBottom: 12,
        }}
      />
      <div
        style={{
          ...logoStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 64,
          color: GREEN,
          letterSpacing: -2,
          lineHeight: 1,
        }}
      >
        AE
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
        Artificial Education
      </div>
    </AbsoluteFill>
  );
}

// ── Segment: Hook (60–120f) ─────────────────────────────────────────────────
function HookSegment({ frame, fps, hook }: { frame: number; fps: number; hook: string }) {
  const localFrame = frame - LOGO_END;
  const style = useSlideUp(localFrame, fps, 5);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 60px" }}
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
      <div
        style={{
          position: "absolute",
          bottom: "42%",
          left: 60,
          height: 5,
          backgroundColor: GREEN,
          width: interpolate(localFrame, [15, 45], [0, 200], { extrapolateRight: "clamp" }),
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Segment: Points (120–345f) ───────────────────────────────────────────────
function PointsSegment({ frame, fps, points }: { frame: number; fps: number; points: string[] }) {
  const localFrame = frame - HOOK_END;

  return (
    <AbsoluteFill
      style={{
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
          color: GREEN,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 8,
          opacity: interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        The signal
      </div>
      {points.slice(0, 3).map((point, i) => {
        const delay = i * 20;
        const style = useSlideUp(localFrame, fps, delay + 5);
        return (
          <div key={i} style={{ ...style, display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: GREEN,
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

// ── Segment: Takeaway (345–420f) ────────────────────────────────────────────
function TakeawaySegment({
  frame, fps, points, takeaway,
}: { frame: number; fps: number; points: string[]; takeaway?: string }) {
  const localFrame = frame - POINTS_END;
  const labelStyle = useSlideUp(localFrame, fps, 5);
  const textStyle = useSlideUp(localFrame, fps, 20);
  const insight = takeaway ?? points[points.length - 1] ?? "";

  return (
    <AbsoluteFill
      style={{
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
          color: GREEN,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        The takeaway
      </div>
      <div
        style={{
          ...textStyle,
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 52,
          color: GREEN,
          lineHeight: 1.2,
        }}
      >
        {insight}
      </div>
    </AbsoluteFill>
  );
}

// ── Segment: CTA (420–510f) ─────────────────────────────────────────────────
function CTASegment({ frame, fps, cta }: { frame: number; fps: number; cta: string }) {
  const localFrame = frame - TAKEAWAY_END;
  const ctaStyle = useSlideUp(localFrame, fps, 5);
  const logoStyle = useSlideUp(localFrame, fps, 20);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}
    >
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
        {cta ?? "Follow @artificialeducation"}
      </div>
      <div
        style={{
          ...logoStyle,
          marginTop: 32,
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 32,
          color: GREEN,
          letterSpacing: -1,
        }}
      >
        AE
      </div>
    </AbsoluteFill>
  );
}

// ── Main composition ─────────────────────────────────────────────────────────
export function AESignal({
  hook, points, takeaway, cta, audioSrc, wordTimings, musicSrc, slideImages,
}: AESignalProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIndex =
    frame < LOGO_END     ? 0
    : frame < HOOK_END     ? 1
    : frame < POINTS_END   ? 2
    : frame < TAKEAWAY_END ? 3
    : 4;

  const currentImage = slideImages?.[slideIndex];
  const [slideStart, slideEnd] = SLIDE_RANGES[slideIndex];

  const renderSegment = () => {
    if (frame < LOGO_END)     return <LogoSegment frame={frame} fps={fps} />;
    if (frame < HOOK_END)     return <HookSegment frame={frame} fps={fps} hook={hook} />;
    if (frame < POINTS_END)   return <PointsSegment frame={frame} fps={fps} points={points} />;
    if (frame < TAKEAWAY_END) return <TakeawaySegment frame={frame} fps={fps} points={points} takeaway={takeaway} />;
    return <CTASegment frame={frame} fps={fps} cta={cta ?? "Follow @artificialeducation"} />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* Background music at 20% volume — full duration */}
      {musicSrc && <Audio src={musicSrc} volume={0.2} />}
      {/* Voiceover at full volume — full duration */}
      {audioSrc && <Audio src={audioSrc} volume={1} />}
      {/* Ken Burns background image — cinematic slow zoom/pan */}
      {currentImage && (
        <KenBurnsImage
          src={currentImage}
          frame={frame}
          slideStart={slideStart}
          slideDuration={slideEnd - slideStart}
          direction={KB_DIRECTIONS[slideIndex]}
        />
      )}
      {/* Slide content */}
      {renderSegment()}
      {/* Word-by-word captions synced to voiceover */}
      {wordTimings && wordTimings.length > 0 && (
        <CaptionOverlay
          wordTimings={wordTimings}
          frame={frame}
          fps={fps}
          accentColor={GREEN}
        />
      )}
    </AbsoluteFill>
  );
}

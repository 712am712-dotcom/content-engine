import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { WordTiming } from "../../../lib/elevenlabs";
import { computeSlideFrames } from "../../../lib/timing";
import { CaptionOverlay } from "../components/caption-overlay";
import { KenBurnsImage, KB_DIRECTIONS } from "../components/ken-burns-image";

export interface MFDTradeTodayProps {
  hook: string;
  points: string[];
  cta: string;
  url: string;
  audioSrc?: string;
  wordTimings?: WordTiming[];
  musicSrc?: string;
  slideImages?: string[];
  logoSfx?: string;
}

const GOLD  = "#F5C518";
const BG    = "#0A0A0A";
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

// ── Segment: Logo ───────────────────────────────────────────────────────────
function LogoSegment({ frame, fps }: { frame: number; fps: number }) {
  const logoStyle    = useSlideUp(frame, fps, 10);
  const taglineStyle = useSlideUp(frame, fps, 25);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}
    >
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

// ── Segment: Hook ───────────────────────────────────────────────────────────
function HookSegment({
  frame, fps, hook, logoEnd,
}: { frame: number; fps: number; hook: string; logoEnd: number }) {
  const localFrame = frame - logoEnd;
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
          backgroundColor: GOLD,
          width: interpolate(localFrame, [15, 45], [0, 200], { extrapolateRight: "clamp" }),
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
}

// ── Segment: Points ─────────────────────────────────────────────────────────
function PointsSegment({
  frame, fps, points, hookEnd,
}: { frame: number; fps: number; points: string[]; hookEnd: number }) {
  const localFrame = frame - hookEnd;

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
          color: GOLD,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 8,
          opacity: interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        The breakdown
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

// ── Segment: The Trade ───────────────────────────────────────────────────────
function TradeSegment({
  frame, fps, points, pointsEnd,
}: { frame: number; fps: number; points: string[]; pointsEnd: number }) {
  const localFrame = frame - pointsEnd;
  const labelStyle = useSlideUp(localFrame, fps, 5);
  const textStyle  = useSlideUp(localFrame, fps, 20);
  const insight    = points[points.length - 1] ?? "";

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

// ── Segment: CTA ─────────────────────────────────────────────────────────────
function CTASegment({
  frame, fps, cta, url, tradeEnd,
}: { frame: number; fps: number; cta: string; url: string; tradeEnd: number }) {
  const localFrame = frame - tradeEnd;
  const ctaStyle   = useSlideUp(localFrame, fps, 10);
  const urlStyle   = useSlideUp(localFrame, fps, 25);
  const logoStyle  = useSlideUp(localFrame, fps, 40);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: GOLD,
          opacity: interpolate(localFrame, [0, 8, 16], [0, 0.08, 0], { extrapolateRight: "clamp" }),
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
        style={{ ...urlStyle, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 28, color: GOLD }}
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
  hook, points, cta, url, audioSrc, wordTimings, musicSrc, slideImages, logoSfx,
}: MFDTradeTodayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic frame boundaries based on actual word counts
  const tradeText = points[points.length - 1] ?? "";
  const sf = computeSlideFrames(hook, points, tradeText, fps);

  const slideIndex =
    frame < sf.logoEnd   ? 0
    : frame < sf.hookEnd   ? 1
    : frame < sf.pointsEnd ? 2
    : frame < sf.tradeEnd  ? 3
    : 4;

  const SLIDE_RANGES: [number, number][] = [
    [0, sf.logoEnd],
    [sf.logoEnd, sf.hookEnd],
    [sf.hookEnd, sf.pointsEnd],
    [sf.pointsEnd, sf.tradeEnd],
    [sf.tradeEnd, sf.total],
  ];

  const currentImage = slideImages?.[slideIndex];
  const [slideStart, slideEnd] = SLIDE_RANGES[slideIndex];

  const renderSegment = () => {
    if (frame < sf.logoEnd)   return <LogoSegment frame={frame} fps={fps} />;
    if (frame < sf.hookEnd)   return <HookSegment frame={frame} fps={fps} hook={hook} logoEnd={sf.logoEnd} />;
    if (frame < sf.pointsEnd) return <PointsSegment frame={frame} fps={fps} points={points} hookEnd={sf.hookEnd} />;
    if (frame < sf.tradeEnd)  return <TradeSegment frame={frame} fps={fps} points={points} pointsEnd={sf.pointsEnd} />;
    return <CTASegment frame={frame} fps={fps} cta={cta} url={url} tradeEnd={sf.tradeEnd} />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* Background music at 20% volume — full duration */}
      {musicSrc && <Audio src={musicSrc} volume={0.2} />}

      {/* Logo whoosh SFX — plays once at frame 0 with the logo animation */}
      {logoSfx && (
        <Sequence from={0} durationInFrames={sf.logoEnd}>
          <Audio src={logoSfx} volume={0.7} />
        </Sequence>
      )}

      {/* Voiceover starts AFTER logo is gone (frame logoEnd = 2s) */}
      {audioSrc && (
        <Sequence from={sf.logoEnd}>
          <Audio src={audioSrc} volume={1} />
        </Sequence>
      )}

      {/* Ken Burns background image */}
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

      {/* Word-by-word captions — offset by logoEnd so they sync to delayed audio */}
      {wordTimings && wordTimings.length > 0 && (
        <CaptionOverlay
          wordTimings={wordTimings}
          frame={frame}
          fps={fps}
          accentColor={GOLD}
          audioStartFrame={sf.logoEnd}
        />
      )}
    </AbsoluteFill>
  );
}

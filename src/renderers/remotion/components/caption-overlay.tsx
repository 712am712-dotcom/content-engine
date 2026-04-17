import React from "react";
import { AbsoluteFill } from "remotion";
import type { WordTiming } from "../../../lib/elevenlabs";

/**
 * CaptionOverlay — word-by-word captions synced to ElevenLabs timestamps.
 *
 * Shows a line of up to WORDS_PER_LINE words at a time. The currently
 * spoken word is highlighted in the accent colour; the others are white.
 * When the active word crosses a line boundary the display advances.
 *
 * Styled to match native Reels/Shorts auto-captions:
 *   - Large bold Inter, black text-shadow outline
 *   - Centered in the bottom third of the frame
 */

const WORDS_PER_LINE = 4;

interface Props {
  wordTimings: WordTiming[];
  frame: number;
  fps: number;
  accentColor: string; // brand accent — GREEN for AE, GOLD for MFD
}

export function CaptionOverlay({ wordTimings, frame, fps, accentColor }: Props) {
  const currentTime = frame / fps;

  // Find the index of the word being spoken right now (last word whose start <= currentTime)
  let activeIdx = -1;
  for (let i = wordTimings.length - 1; i >= 0; i--) {
    if (currentTime >= wordTimings[i].s) { activeIdx = i; break; }
  }
  // If we're past the last word's end, hide captions
  if (activeIdx >= 0 && currentTime > wordTimings[activeIdx].e + 0.3) {
    activeIdx = -1;
  }
  if (activeIdx < 0) return null;

  // Which line is the active word in?
  const lineStart = Math.floor(activeIdx / WORDS_PER_LINE) * WORDS_PER_LINE;
  const lineWords = wordTimings.slice(lineStart, lineStart + WORDS_PER_LINE);
  const activeInLine = activeIdx - lineStart;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 160,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 14,
          rowGap: 8,
          maxWidth: 920,
          padding: "0 40px",
        }}
      >
        {lineWords.map((word, i) => (
          <span
            key={`${lineStart}-${i}`}
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: 68,
              lineHeight: 1.1,
              color: i === activeInLine ? accentColor : "#FFFFFF",
              textShadow:
                "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.85)",
            }}
          >
            {word.w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

import React from "react";
import { AbsoluteFill } from "remotion";
import type { WordTiming } from "../../../lib/elevenlabs";

/**
 * CaptionOverlay — word-by-word captions synced to ElevenLabs timestamps.
 *
 * audioStartFrame: global frame at which the voiceover audio starts.
 * All word timestamps (from ElevenLabs) are relative to the start of the
 * audio file, so we convert to video-timeline time by subtracting
 * audioStartFrame before looking up the active word.
 *
 * Word transition: a word is active from its start time until the NEXT
 * word's start time (not its own end time). This eliminates flicker and
 * gaps between words — highlighting switches exactly when speech does.
 */

const WORDS_PER_LINE = 4;

interface Props {
  wordTimings: WordTiming[];
  frame: number;
  fps: number;
  accentColor: string;
  audioStartFrame?: number; // global frame when voiceover starts (default 0)
}

export function CaptionOverlay({
  wordTimings,
  frame,
  fps,
  accentColor,
  audioStartFrame = 0,
}: Props) {
  // Don't render before the audio starts
  if (frame < audioStartFrame) return null;

  // Convert video frame to audio-relative time
  const audioTime = (frame - audioStartFrame) / fps;

  // Find active word: first word where audioTime is in [word.s, nextWord.s)
  let activeIdx = -1;
  for (let i = 0; i < wordTimings.length; i++) {
    const start = wordTimings[i].s;
    // Use next word's start as the upper boundary — no gaps between words
    const end = i + 1 < wordTimings.length
      ? wordTimings[i + 1].s
      : wordTimings[i].e + 0.15; // grace period after last word
    if (audioTime >= start && audioTime < end) {
      activeIdx = i;
      break;
    }
  }

  if (activeIdx < 0) return null;

  // Which line is the active word in?
  const lineStart   = Math.floor(activeIdx / WORDS_PER_LINE) * WORDS_PER_LINE;
  const lineWords   = wordTimings.slice(lineStart, lineStart + WORDS_PER_LINE);
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

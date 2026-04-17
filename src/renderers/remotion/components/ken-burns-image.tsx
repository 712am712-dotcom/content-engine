import React from "react";
import { AbsoluteFill, Img, interpolate } from "remotion";

/**
 * KenBurnsImage — slowly zooms or pans a background image.
 *
 * Adds cinematic movement to each slide so the background feels alive
 * instead of a hard cut between static images.
 *
 * Directions alternate across slides for visual variety:
 *   zoom-in  — scale 1.00→1.08, centre anchor
 *   pan-right — scale 1.05, translate X left→right
 *   pan-left  — scale 1.05, translate X right→left
 */

export type KenBurnsDirection = "zoom-in" | "pan-right" | "pan-left";

// Cycle through directions per slide index
export const KB_DIRECTIONS: KenBurnsDirection[] = [
  "zoom-in",    // 0: Logo
  "pan-right",  // 1: Hook
  "zoom-in",    // 2: Points
  "pan-left",   // 3: Trade/Takeaway
  "zoom-in",    // 4: CTA
];

interface Props {
  src: string;
  frame: number;
  slideStart: number;   // global frame this slide begins
  slideDuration: number; // how many frames this slide lasts
  direction: KenBurnsDirection;
  opacity?: number;
}

export function KenBurnsImage({
  src,
  frame,
  slideStart,
  slideDuration,
  direction,
  opacity = 0.4,
}: Props) {
  const progress = Math.min(Math.max((frame - slideStart) / slideDuration, 0), 1);

  let transform: string;
  if (direction === "zoom-in") {
    const scale = interpolate(progress, [0, 1], [1.0, 1.08]);
    transform = `scale(${scale})`;
  } else if (direction === "pan-right") {
    const tx = interpolate(progress, [0, 1], [-2.5, 2.5]); // percent of width
    transform = `scale(1.05) translateX(${tx}%)`;
  } else {
    const tx = interpolate(progress, [0, 1], [2.5, -2.5]);
    transform = `scale(1.05) translateX(${tx}%)`;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
          transform,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
}

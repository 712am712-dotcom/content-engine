/**
 * timing.ts — Dynamic slide duration calculation.
 *
 * Duration formula: max(minSeconds, word_count * 0.4s) per slide.
 * Points slide uses the sum of all bullet words (they show simultaneously).
 * Logo and CTA are always fixed durations.
 *
 * Used in both entry.tsx (calculateMetadata for total durationInFrames)
 * and inside composition components (frame boundary constants).
 */

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slideDur(text: string, minSecs: number, fps: number): number {
  return Math.max(minSecs * fps, Math.round(wordCount(text) * 0.4 * fps));
}

export interface SlideFrames {
  logoEnd: number;
  hookEnd: number;
  pointsEnd: number;
  tradeEnd: number;
  total: number;
}

/**
 * Compute frame boundaries for all 5 slides.
 *
 * @param hook      - hook text (slide 1)
 * @param points    - bullet points (slide 2, shown simultaneously)
 * @param tradeText - trade or takeaway text (slide 3)
 * @param fps       - frames per second (default 30)
 */
export function computeSlideFrames(
  hook: string,
  points: string[],
  tradeText: string,
  fps = 30,
): SlideFrames {
  const LOGO_DUR = 2 * fps;   // always 2s — brand intro, no content
  const CTA_DUR  = 3 * fps;   // always 3s — CTA, short/fixed

  const hookDur   = slideDur(hook, 2, fps);

  // All 3 bullets show at once — duration covers the full reading load
  const totalPointWords = points.slice(0, 3).reduce((s, p) => s + wordCount(p), 0);
  const pointsDur = Math.max(4 * fps, Math.round(totalPointWords * 0.4 * fps));

  const tradeDur  = slideDur(tradeText, 2.5, fps);

  const logoEnd   = LOGO_DUR;
  const hookEnd   = logoEnd   + hookDur;
  const pointsEnd = hookEnd   + pointsDur;
  const tradeEnd  = pointsEnd + tradeDur;
  const total     = tradeEnd  + CTA_DUR;

  return { logoEnd, hookEnd, pointsEnd, tradeEnd, total };
}

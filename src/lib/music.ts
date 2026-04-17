/**
 * music.ts — Background music track selection per brand.
 *
 * Returns a direct HTTPS MP3 URL that Remotion's <Audio> component
 * fetches during rendering. No download/base64 needed — Remotion's
 * headless Chrome handles it natively.
 *
 * Tracks are royalty-free (CC licensed). Swap URLs here to update the
 * music library — no other code changes needed.
 *
 * MFD: focused, cinematic, lo-fi financial feel
 * AE:  ambient electronic, tech-forward
 */

const TRACKS: Record<string, string[]> = {
  mfd: [
    // Chill lo-fi / corporate focus — bensound.com (CC Attribution)
    "https://cdn.pixabay.com/audio/2023/10/09/audio_2ba0b69d86.mp3",
    "https://cdn.pixabay.com/audio/2023/03/07/audio_42e5282f18.mp3",
  ],
  ae: [
    // Ambient electronic / synthwave
    "https://cdn.pixabay.com/audio/2023/08/14/audio_c5b6ab7a61.mp3",
    "https://cdn.pixabay.com/audio/2022/10/25/audio_946b5de3c3.mp3",
  ],
};

/** Returns a music track URL for the given brand. Always returns a value. */
export function getMusicUrl(brand: string): string {
  const tracks = TRACKS[brand.toLowerCase()] ?? TRACKS.ae;
  // Deterministic pick (no randomness) so re-renders are consistent
  return tracks[0];
}

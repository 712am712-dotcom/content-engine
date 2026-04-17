/**
 * music.ts — Background music per brand, pre-fetched as base64 data URLs.
 *
 * Audio is fetched in Node.js and passed as a data:audio/mpeg;base64,...
 * URL so Remotion's headless Chrome never needs to make an external HTTP
 * request for it (avoids CDN 403s on datacenter IPs).
 *
 * Tracks are royalty-free / CC-licensed. Swap track URLs here to update
 * the library — no other code changes needed.
 *
 * MFD: focused lo-fi / cinematic financial feel
 * AE:  ambient electronic / tech-forward
 *
 * Override via env vars: MUSIC_MFD_URL, MUSIC_AE_URL
 */

const TRACK_URLS: Record<string, string> = {
  // SoundHelix: open-licensed synthetic tracks, no IP blocking, always available
  mfd: process.env.MUSIC_MFD_URL ?? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  ae:  process.env.MUSIC_AE_URL  ?? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

const FETCH_TIMEOUT_MS = 20_000;

/**
 * Fetches the track for the given brand and returns a base64 data URL,
 * or null if the fetch fails (music is always non-fatal).
 */
export async function fetchMusicDataUrl(brand: string): Promise<string | null> {
  const url = TRACK_URLS[brand.toLowerCase()] ?? TRACK_URLS.ae;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    console.log(`[music] Fetching ${brand} track…`);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; content-engine/1.0)" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    console.log(`[music] Track ready — ${Math.round(buffer.byteLength / 1024)}KB`);
    return `data:audio/mpeg;base64,${base64}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[music] Track fetch failed (non-fatal): ${msg}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

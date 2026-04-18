/**
 * sfx.ts — Logo sound effect, pre-fetched as base64.
 *
 * Fetched server-side (Node.js) so Remotion's headless Chrome never
 * makes an external HTTP request for it — avoids datacenter CDN 403s.
 *
 * Non-fatal: if the fetch fails the render proceeds without the SFX.
 * Override the URL via the LOGO_SFX_URL env var.
 */

const DEFAULT_SFX_URL =
  process.env.LOGO_SFX_URL ??
  // Freesound whoosh preview (CC BY 4.0) — freesound.org/s/709335/
  "https://cdn.freesound.org/previews/709/709335_1089955-lq.mp3";

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchLogoSfx(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    console.log("[sfx] Fetching logo SFX…");
    const res = await fetch(DEFAULT_SFX_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; content-engine/1.0)" },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    console.log(`[sfx] Logo SFX ready — ${Math.round(buffer.byteLength / 1024)}KB`);
    return `data:audio/mpeg;base64,${base64}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sfx] Logo SFX fetch failed (non-fatal): ${msg}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

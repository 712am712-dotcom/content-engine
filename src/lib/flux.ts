/**
 * flux.ts — Flux 1.1 Pro image generation via BFL API.
 *
 * Generates images in parallel (one per slide), returning an array of
 * HTTPS CDN URLs. Remotion's <Img> component fetches these during rendering.
 *
 * BFL requires width/height to be multiples of 32. We round up.
 * If FLUX_API_KEY is not set, returns null and the render proceeds
 * without background images.
 */

const BFL_BASE = "https://api.us1.bfl.ai/v1";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 90_000;

function roundTo32(n: number): number {
  return Math.ceil(n / 32) * 32;
}

async function generateOne(
  prompt: string,
  width: number,
  height: number,
  apiKey: string,
): Promise<string> {
  // Submit generation request
  const submitRes = await fetch(`${BFL_BASE}/flux-pro-1.1`, {
    method: "POST",
    headers: {
      "X-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      width:  roundTo32(width),
      height: roundTo32(height),
      steps: 20,
      guidance: 3.5,
      output_format: "jpeg",
      safety_tolerance: 6,
    }),
  });

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => "(unreadable)");
    throw new Error(`Flux submit failed ${submitRes.status}: ${body}`);
  }

  const { id } = (await submitRes.json()) as { id: string };
  if (!id) throw new Error("Flux submit returned no request id");

  // Poll until Ready
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(`${BFL_BASE}/get_result?id=${id}`, {
      headers: { "X-Key": apiKey },
    });

    if (!pollRes.ok) continue;

    const data = (await pollRes.json()) as {
      status: string;
      result?: { sample?: string };
    };

    if (data.status === "Ready") {
      const url = data.result?.sample;
      if (!url) throw new Error("Flux result missing sample URL");
      return url;
    }

    if (data.status === "Error" || data.status === "Failed") {
      throw new Error(`Flux generation failed: ${JSON.stringify(data)}`);
    }
    // status === "Pending" | "Processing" — keep polling
  }

  throw new Error(`Flux generation timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

/**
 * Generate one image per slide in parallel.
 * Returns an array of 5 HTTPS image URLs, or null if FLUX_API_KEY is not set.
 */
export async function generateSlideImages(
  prompts: string[],
  width: number,
  height: number,
): Promise<string[] | null> {
  const apiKey = process.env.FLUX_API_KEY;
  if (!apiKey) {
    console.log("[flux] FLUX_API_KEY not set — skipping background images");
    return null;
  }

  console.log(`[flux] Generating ${prompts.length} images ${width}×${height}`);
  const start = Date.now();

  const results = await Promise.all(
    prompts.map((p, i) =>
      generateOne(p, width, height, apiKey).catch((err) => {
        console.warn(`[flux] slide ${i} failed: ${err.message}`);
        return null as unknown as string; // non-fatal: missing slide gets no image
      }),
    ),
  );

  const ok = results.filter(Boolean).length;
  console.log(`[flux] ${ok}/${prompts.length} images ready in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return results;
}

/**
 * Build 5 slide image prompts from brand + content.
 * Prompts match the 5 composition segments:
 *   0 = Logo, 1 = Hook, 2 = Points, 3 = Trade/Takeaway, 4 = CTA
 */
export function buildImagePrompts(
  brand: string,
  content: Record<string, unknown>,
): string[] {
  const hook = String(content.hook ?? "").slice(0, 120);
  const isMFD = brand === "mfd";

  const base = isMFD
    ? "cinematic dark background, dramatic gold accent lighting, Wall Street aesthetics, 8K, no text, no watermark, no people"
    : "cinematic dark background, electric green neon glow, AI neural network, futuristic tech, 8K, no text, no watermark, no people";

  return [
    `${base}, abstract luxury brand intro, minimal geometric shapes`,
    `${base}, dramatic scene evoking: "${hook}"`,
    `${base}, ${isMFD ? "financial data visualization, stock charts, trading screens" : "AI model architecture, data streams, glowing nodes"}`,
    `${base}, ${isMFD ? "decisive moment, bull market, golden hour" : "human insight, technology breakthrough, close-up detail"}`,
    `${base}, ${isMFD ? "wealth creation, premium lifestyle, aspirational" : "knowledge and growth, learning journey, community"}`,
  ];
}

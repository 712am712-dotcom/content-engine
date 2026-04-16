/**
 * pexels.ts — Stock image search via Pexels API.
 *
 * For each slide query, searches Pexels and returns the first result's
 * original HTTPS CDN URL. Remotion's <Img> component fetches these at
 * render time — no local download needed.
 *
 * Orientation is chosen based on format dimensions:
 *   portrait  → height > width  (vertical_30s)
 *   landscape → width  > height (landscape_30s)
 *   square    → square          (square_30s)
 *
 * If PEXELS_API_KEY is not set, returns null and the render proceeds
 * without background images.
 */

const PEXELS_BASE = "https://api.pexels.com/v1";

type PexelsOrientation = "portrait" | "landscape" | "square";

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

function orientationFromDims(width: number, height: number): PexelsOrientation {
  if (width === height) return "square";
  return height > width ? "portrait" : "landscape";
}

async function searchOne(
  query: string,
  orientation: PexelsOrientation,
  apiKey: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    query,
    orientation,
    per_page: "1",
    size: "large",
  });

  const res = await fetch(`${PEXELS_BASE}/search?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`Pexels search failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as PexelsSearchResponse;
  const photo = data.photos?.[0];
  if (!photo) return null; // no results for this query

  // large2x is ~1880px wide — good balance of quality vs file size
  return photo.src.large2x;
}

/**
 * Build 5 slide search queries from brand + content.
 * Queries match the 5 composition segments:
 *   0 = Logo, 1 = Hook, 2 = Points, 3 = Trade/Takeaway, 4 = CTA
 */
export function buildImageQueries(
  brand: string,
  content: Record<string, unknown>,
): string[] {
  const hook = String(content.hook ?? "").slice(0, 80);
  const points = (content.points as string[] | undefined) ?? [];
  const isMFD = brand === "mfd";

  // Slide 0 (Logo) — brand intro
  const logoQuery = isMFD
    ? "wall street finance luxury dark"
    : "artificial intelligence neural network dark";

  // Slide 1 (Hook) — derived from hook text
  const hookQuery = hook || (isMFD ? "stock market finance" : "technology innovation");

  // Slides 2–4 — from the first three points (or fallbacks)
  const point0 = points[0]?.slice(0, 60) || hookQuery;
  const point1 = points[1]?.slice(0, 60) || hookQuery;
  const point2 = points[2]?.slice(0, 60) || (isMFD ? "investment growth" : "future technology");

  return [logoQuery, hookQuery, point0, point1, point2];
}

/**
 * Fetch one image per slide in parallel.
 * Returns an array of 5 HTTPS image URLs, or null if PEXELS_API_KEY is not set.
 * Per-slide failures are non-fatal — that slide renders without a background.
 */
export async function fetchSlideImages(
  queries: string[],
  width: number,
  height: number,
): Promise<string[] | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.log("[pexels] PEXELS_API_KEY not set — skipping background images");
    return null;
  }

  const orientation = orientationFromDims(width, height);
  console.log(`[pexels] Fetching ${queries.length} images (${orientation})`);
  const start = Date.now();

  const results = (await Promise.all(
    queries.map((q, i) =>
      searchOne(q, orientation, apiKey).catch((err: Error) => {
        console.warn(`[pexels] slide ${i} failed: ${err.message}`);
        return null; // non-fatal: missing slide gets no image
      }),
    ),
  )) as string[];

  const ok = results.filter(Boolean).length;
  console.log(
    `[pexels] ${ok}/${queries.length} images ready in ${((Date.now() - start) / 1000).toFixed(1)}s`,
  );
  return results;
}

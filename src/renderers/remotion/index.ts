import path from "path";
import os from "os";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import type { ContentJob } from "../../lib/supabase";
import type { Renderer } from "../index";
import { getBrand } from "../../brands/index";
import { generateVoiceover, buildVoiceoverScript } from "../../lib/elevenlabs";
import { fetchSlideImages, buildImageQueries } from "../../lib/pexels";
import { getMusicUrl } from "../../lib/music";

const COMPOSITIONS: Record<string, string> = {
  "trade-today:vertical_30s":  "MFDTradeToday-vertical-30s",
  "trade-today:square_30s":    "MFDTradeToday-square-30s",
  "trade-today:landscape_30s": "MFDTradeToday-landscape-30s",
  "ae-signal:vertical_30s":    "AESignal-vertical-30s",
  "ae-signal:square_30s":      "AESignal-square-30s",
  "ae-signal:landscape_30s":   "AESignal-landscape-30s",
};

const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  vertical_30s:  { width: 1080, height: 1920 },
  square_30s:    { width: 1080, height: 1080 },
  landscape_30s: { width: 1920, height: 1080 },
};

export const remotionRenderer: Renderer = {
  async render(job: ContentJob): Promise<{ outputUrl: string; localPath: string }> {
    const format = job.format ?? "vertical_30s";
    const compositionKey = `${job.template}:${format}`;
    const compositionId = COMPOSITIONS[compositionKey];
    if (!compositionId) {
      throw new Error(`Unknown template/format: ${compositionKey}`);
    }

    const dims = FORMAT_DIMS[format] ?? { width: 1080, height: 1920 };

    // ── Optional enrichment: voiceover + background images + music ──────────
    // All are best-effort — failures log a warning but never block the render.
    let audioSrc: string | null = null;
    let wordTimings: unknown[] | null = null;
    let slideImages: string[] | null = null;
    const musicSrc = getMusicUrl(job.brand);

    try {
      const brand = getBrand(job.brand);
      const voiceId = (brand as { voiceId?: string }).voiceId;

      const [voiceoverResult, images] = await Promise.all([
        voiceId
          ? generateVoiceover(buildVoiceoverScript(job.content), voiceId).catch((err) => {
              console.warn(`[remotion] voiceover failed (non-fatal): ${err.message}`);
              return null;
            })
          : Promise.resolve(null),
        fetchSlideImages(
          buildImageQueries(job.brand, job.content),
          dims.width,
          dims.height,
        ).catch((err) => {
          console.warn(`[remotion] image fetch failed (non-fatal): ${err.message}`);
          return null;
        }),
      ]);

      audioSrc    = voiceoverResult?.audioSrc ?? null;
      wordTimings = voiceoverResult?.wordTimings ?? null;
      slideImages = images;
    } catch (err) {
      console.warn(`[remotion] enrichment step failed (non-fatal): ${err}`);
    }

    // ── Merge enrichment into inputProps ─────────────────────────────────────
    const inputProps: Record<string, unknown> = {
      ...job.content,
      ...(audioSrc    ? { audioSrc }       : {}),
      ...(wordTimings ? { wordTimings }     : {}),
      ...(slideImages ? { slideImages }     : {}),
      musicSrc,
    };

    const entryPoint = path.resolve(__dirname, "entry.js");
    const outputDir = path.join(os.tmpdir(), "content-engine-renders");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${job.id}.mp4`);

    console.log(`[remotion] Bundling entry point: ${entryPoint}`);
    const bundled = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    console.log(`[remotion] Selecting composition: ${compositionId}`);
    const composition = await selectComposition({
      serveUrl: bundled,
      id: compositionId,
      inputProps,
    });

    console.log(`[remotion] Rendering ${compositionId} → ${outputPath}`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      concurrency: 1,
      x264Preset: "ultrafast",
      crf: 28,
      ffmpegOverride: ({ args }) => {
        const idx = args.indexOf("libx264");
        if (idx !== -1) {
          const modified = [
            ...args.slice(0, idx + 1),
            "-x264opts", "threads=2",
            ...args.slice(idx + 1),
          ];
          console.log(`[remotion] ffmpeg args (${modified.length}): ${modified.join(" ")}`);
          return modified;
        }
        return args;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

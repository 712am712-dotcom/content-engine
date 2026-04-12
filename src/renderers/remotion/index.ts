import path from "path";
import os from "os";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import type { ContentJob } from "../../lib/supabase";
import type { Renderer } from "../index";

const COMPOSITIONS: Record<string, string> = {
  "trade-today": "MFDTradeToday",
  "ae-signal": "AESignal",
};

export const remotionRenderer: Renderer = {
  async render(job: ContentJob): Promise<{ outputUrl: string; localPath: string }> {
    const compositionId = COMPOSITIONS[job.template];
    if (!compositionId) {
      throw new Error(`Unknown template: ${job.template}`);
    }

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
      inputProps: job.content,
    });

    console.log(`[remotion] Rendering ${compositionId} → ${outputPath}`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: job.content,
      // Limit parallel Chrome frame renders (number of tabs, not a ratio)
      concurrency: 1,
      x264Preset: "ultrafast",  // lowest memory among presets
      crf: 28,
      // Cap x264 threads to prevent OOM on Railway (60 cores auto-detected).
      // Insert -x264opts immediately after -c:v libx264 — canonical position.
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
        console.log(`[remotion] WARN: libx264 not found in args, passing through unchanged`);
        return args;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

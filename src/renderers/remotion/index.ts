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
      // Memory-conservative settings for Railway containers
      concurrencyPerCpu: 0.5,
      x264Preset: "veryfast",    // less memory than default "medium"
      crf: 23,
      // Cap FFmpeg/x264 at 2 threads — default autodetects all cores → SIGKILL
      ffmpegOverride: ({ args }) => {
        // Insert -threads 2 before the output file argument
        const outIdx = args.lastIndexOf(outputPath);
        return [
          ...args.slice(0, outIdx),
          "-threads",
          "2",
          ...args.slice(outIdx),
        ];
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

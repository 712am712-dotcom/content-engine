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
      // Limit parallel Chrome frame renders to 1/2 a CPU
      concurrencyPerCpu: 0.5,
      // Faster preset uses less lookahead memory
      x264Preset: "veryfast",
      crf: 23,
      // Inject global -threads 2 flag as the very first ffmpeg arg.
      // Also pass -x264-params threads=2 so libx264 doesn't spawn 60 threads.
      // args[0] is the ffmpeg binary path; we insert our flags right after it.
      ffmpegOverride: ({ args }) => {
        const [bin, ...rest] = args;
        const overrideArgs = [
          bin,
          "-threads", "2",
          ...rest,
          // x264-params must come after output spec; append at end
          "-x264-params", "threads=2:lookaheadthreads=1",
        ];
        console.log(`[remotion] ffmpeg args: ${overrideArgs.join(" ").slice(0, 200)}`);
        return overrideArgs;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

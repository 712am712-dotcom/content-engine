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
      // Limit parallel Chrome frame renders
      concurrencyPerCpu: 0.5,
      x264Preset: "veryfast",
      crf: 23,
      // Strip any -threads flag Remotion injects (it auto-detects cores → OOM),
      // then prepend our own cap of 2 threads.
      ffmpegOverride: ({ args }) => {
        const [bin, ...rest] = args;

        // Remove existing -threads <value> pairs from Remotion's arg list
        const filtered: string[] = [];
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "-threads") {
            i++; // skip the value too
            continue;
          }
          filtered.push(rest[i]);
        }

        const finalArgs = [bin, "-threads", "2", ...filtered];
        console.log(`[remotion] ffmpeg: ${finalArgs.slice(0, 10).join(" ")} ...`);
        return finalArgs;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

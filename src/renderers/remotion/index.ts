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
      // Strip any -threads Remotion auto-injects (maps to ~60 on Railway hosts)
      // then cap at 2 so x264 doesn't OOM the container.
      ffmpegOverride: ({ args }) => {
        const [bin, ...rest] = args;
        const filtered: string[] = [];
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "-threads") {
            i++; // skip the value
            continue;
          }
          filtered.push(rest[i]);
        }
        const finalArgs = [bin, "-threads", "2", ...filtered];
        console.log(`[remotion] ffmpeg: ${finalArgs.slice(0, 10).join(" ")}`);
        return finalArgs;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

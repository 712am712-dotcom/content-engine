import path from "path";
import os from "os";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

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

    console.log(`[remotion] Fetching compositions from bundle`);
    // v3 API: getCompositions (selectComposition doesn't exist in v3)
    // Use system ffmpeg/ffprobe (apt-installed) — v3's CDN for its own binaries returns 403
    const compositions = await getCompositions(bundled, {
      inputProps: job.content,
      ffmpegExecutable: "ffmpeg",
      ffprobeExecutable: "ffprobe",
    });
    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
      throw new Error(`Composition "${compositionId}" not found in bundle`);
    }

    console.log(`[remotion] Rendering ${compositionId} → ${outputPath}`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: job.content,
      // Use system ffmpeg/ffprobe (apt-installed via nixpacks.toml)
      ffmpegExecutable: "ffmpeg",
      ffprobeExecutable: "ffprobe",
      // v3: concurrency is a number (parallel Chrome tabs), not concurrencyPerCpu
      concurrency: 1,
      crf: 23,
      // Strip any -threads Remotion injects (auto-detects ~60 cores → OOM on Railway)
      // then cap at 2 threads so x264 doesn't blow out the container.
      ffmpegOverride: ({ args }) => {
        const [bin, ...rest] = args;
        const filtered: string[] = [];
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "-threads") {
            i++;
            continue;
          }
          filtered.push(rest[i]);
        }
        const finalArgs = [bin, "-threads", "2", ...filtered];
        console.log(`[remotion] ffmpeg: ${finalArgs.slice(0, 8).join(" ")}`);
        return finalArgs;
      },
    });

    console.log(`[remotion] Render complete: ${outputPath}`);
    return { outputUrl: "", localPath: outputPath };
  },
};

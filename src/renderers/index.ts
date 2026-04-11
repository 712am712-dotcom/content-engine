import type { ContentJob } from "../lib/supabase";

export interface RenderResult {
  outputUrl: string;
  localPath: string;
}

export interface Renderer {
  render(job: ContentJob): Promise<RenderResult>;
}

// Registry — add new renderers here as they come online
import { remotionRenderer } from "./remotion/index";

export const renderers: Record<string, Renderer> = {
  remotion: remotionRenderer,
  // heygen: heygenRenderer,   ← future
  // runway: runwayRenderer,   ← future
};

export function getRenderer(name: string): Renderer {
  const renderer = renderers[name];
  if (!renderer) throw new Error(`Unknown renderer: ${name}`);
  return renderer;
}

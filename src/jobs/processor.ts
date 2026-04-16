import fs from "fs";
import path from "path";
import { supabase, type ContentJob } from "../lib/supabase";
import { getRenderer } from "../renderers/index";

const POLL_INTERVAL_MS = 10_000;
const STORAGE_BUCKET = "renders";

async function uploadToStorage(jobId: string, localPath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const storagePath = `${jobId}.mp4`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

async function processNextJob(): Promise<void> {
  // 1. Claim a pending job atomically
  const { data: jobs, error: selectError } = await supabase
    .from("content_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (selectError) {
    console.error("[processor] Select error:", selectError.message);
    return;
  }

  if (!jobs || jobs.length === 0) return; // nothing to do

  const job = jobs[0] as ContentJob;

  // 2. Mark as rendering
  const { error: updateError } = await supabase
    .from("content_jobs")
    .update({ status: "rendering" })
    .eq("id", job.id)
    .eq("status", "pending"); // guard against double-claim

  if (updateError) {
    console.error("[processor] Failed to claim job:", updateError.message);
    return;
  }

  console.log(`[processor] Rendering job ${job.id} — brand=${job.brand} template=${job.template}`);

  try {
    // 3. Render
    const renderer = getRenderer(job.renderer);
    const { localPath } = await renderer.render(job);

    // 4. Upload to Supabase Storage
    console.log(`[processor] Uploading ${localPath} to storage…`);
    const outputUrl = await uploadToStorage(job.id, localPath);

    // Clean up temp file
    try { fs.unlinkSync(localPath); } catch (_) { /* non-fatal */ }

    // 5. Mark rendered
    const { error: renderUpdateError } = await supabase
      .from("content_jobs")
      .update({ status: "rendered", output_url: outputUrl })
      .eq("id", job.id);

    if (renderUpdateError) {
      console.error(`[processor] Failed to mark job ${job.id} as rendered:`, renderUpdateError.message);
    } else {
      console.log(`[processor] ✓ Job ${job.id} rendered → ${outputUrl}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[processor] ✗ Job ${job.id} failed:`, message);

    await supabase
      .from("content_jobs")
      .update({ status: "failed" })
      .eq("id", job.id);
  }
}

export function startProcessor(): void {
  console.log(`[processor] Starting — polling every ${POLL_INTERVAL_MS / 1000}s`);

  // Run immediately, then on interval
  processNextJob();
  setInterval(processNextJob, POLL_INTERVAL_MS);
}

import { Router, type Request, type Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// ── API key middleware ────────────────────────────────────────────────────────
// If CONTENT_ENGINE_API_KEY is set, an x-api-key header matching it is required.
// If the env var is not set, the endpoint is open (dev mode).
function apiKeyMiddleware(req: Request, res: Response, next: () => void) {
  const requiredKey = process.env.CONTENT_ENGINE_API_KEY;
  if (!requiredKey) return next(); // open in dev

  const provided = req.headers["x-api-key"];
  if (provided !== requiredKey) {
    res.status(401).json({ error: "Invalid or missing x-api-key" });
    return;
  }
  next();
}

// ── POST /api/render ─────────────────────────────────────────────────────────
router.post("/", apiKeyMiddleware, async (req: Request, res: Response) => {
  const { brand, renderer = "remotion", template, content, format = "vertical_30s" } = req.body;

  // Basic validation
  if (!brand || !template || !content) {
    res.status(400).json({
      error: "Missing required fields: brand, template, content",
    });
    return;
  }

  if (typeof content !== "object" || Array.isArray(content)) {
    res.status(400).json({ error: "content must be a JSON object" });
    return;
  }

  const { data, error } = await supabase
    .from("content_jobs")
    .insert({
      brand,
      renderer,
      template,
      content,
      format,
      status: "pending",
    })
    .select("id, brand, template, status, created_at")
    .single();

  if (error) {
    console.error("[api/render] Insert error:", error.message);
    res.status(500).json({ error: "Failed to create job" });
    return;
  }

  res.status(202).json({ jobId: data.id, status: data.status, brand: data.brand, template: data.template });
});

// ── GET /api/render/:id — poll job status ────────────────────────────────────
router.get("/:id", apiKeyMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("content_jobs")
    .select("id, brand, template, status, output_url, created_at, updated_at")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(data);
});

export default router;

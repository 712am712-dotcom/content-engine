import "dotenv/config";
import express from "express";
import cors from "cors";
import renderRouter from "./api/render";
import { startProcessor } from "./jobs/processor";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
const BUILD_SHA = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "content-engine", sha: BUILD_SHA, ts: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/render", renderRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[content-engine] API listening on port ${PORT}`);
  startProcessor();
});

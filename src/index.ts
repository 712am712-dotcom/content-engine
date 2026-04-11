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
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "content-engine", ts: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/render", renderRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[content-engine] API listening on port ${PORT}`);
  startProcessor();
});

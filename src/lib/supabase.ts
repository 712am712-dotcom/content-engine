import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export type JobStatus =
  | "pending"
  | "rendering"
  | "rendered"
  | "approved"
  | "posted"
  | "failed";

export interface ContentJob {
  id: string;
  brand: string;
  renderer: string;
  template: string;
  content: Record<string, unknown>;
  format: string;
  status: JobStatus;
  output_url: string | null;
  created_at: string;
  updated_at: string;
}

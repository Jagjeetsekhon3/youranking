// ──────────────────────────────────────────────────────────────
// MODEL ROUTER — the keystone.
// Features never name a model. They name a TASK. The router decides
// who runs it (Claude vs Gemini) and on which tier. Change cost /
// swap models here, in ONE place, without touching feature code.
// ──────────────────────────────────────────────────────────────

import { callClaude } from "./claude";
import { callGemini } from "./gemini";

// Model ids live here so they're swappable. Verify exact strings
// against current provider docs — Gemini ids shift often.
export const MODELS = {
  claudeSonnet: "claude-sonnet-4-6",   // craft + judgment
  claudeOpus: "claude-opus-4-8",        // hardest reasoning only (rare)
  geminiFlash: "gemini-flash-latest",        // vision + default multimodal
  geminiFlashLite: "gemini-flash-lite-latest", // cheap bulk work
} as const;

// Every task the app can ask for, mapped to a provider + model.
// Principle: Gemini = eyes + volume. Claude = craft + judgment.
type Route = { provider: "claude" | "gemini"; model: string };

export const TASKS = {
  "title.generate": { provider: "claude", model: MODELS.claudeSonnet },
  "title.score":    { provider: "claude", model: MODELS.claudeSonnet },
  "hook.rewrite":   { provider: "claude", model: MODELS.claudeSonnet },  // Claude crafts the new hooks
  "hook.analyze":   { provider: "gemini", model: MODELS.geminiFlash },   // Gemini watches the opening
  "thumbnail.read": { provider: "gemini", model: MODELS.geminiFlash },     // vision
  "seo.audit":      { provider: "gemini", model: MODELS.geminiFlash },     // reads the video
  "niche.score":    { provider: "gemini", model: MODELS.geminiFlash },
  "competitor.gap": { provider: "gemini", model: MODELS.geminiFlash },
  "tags.generate":  { provider: "gemini", model: MODELS.geminiFlashLite }, // bulk
  "keyword.expand": { provider: "gemini", model: MODELS.geminiFlashLite }, // bulk
} satisfies Record<string, Route>;

export type Task = keyof typeof TASKS;

export interface RunOptions {
  system?: string;
  prompt: string;
  images?: { mediaType: string; data: string }[]; // base64, for Gemini vision
  videoUrl?: string; // a YouTube URL for Gemini to watch (ignored by Claude)
  json?: boolean; // ask the model for raw JSON
}

// Single entry point. A feature calls run("title.generate", {...}).
export async function run(task: Task, opts: RunOptions): Promise<string> {
  const route = TASKS[task];
  if (route.provider === "claude") {
    return callClaude({ model: route.model, ...opts });
  }
  return callGemini({ model: route.model, ...opts });
}

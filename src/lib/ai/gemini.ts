// Gemini client — thin wrapper. Called only by the router.
// Supports inline images (base64) for vision tasks like the
// Thumbnail A/B Reader. Endpoint: Generative Language API.
import { RunOptions } from "./router";
import { getKey } from "../settings";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Model resolution ────────────────────────────────────────────
// Gemini renames models constantly and availability differs per key,
// so we never trust a hardcoded id. We ask ListModels what actually
// exists for THIS key and pick the closest flash model. Cached 5 min.
let modelCache: { names: Set<string>; at: number } | null = null;

export async function geminiModelNames(key: string): Promise<Set<string>> {
  if (modelCache && Date.now() - modelCache.at < 300_000) return modelCache.names;
  try {
    const res = await fetch(`${BASE}?key=${key}&pageSize=200`);
    if (!res.ok) return new Set();
    const data = await res.json();
    const names = new Set<string>(
      (data.models || [])
        .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m: any) => (m.name || "").replace("models/", ""))
    );
    modelCache = { names, at: Date.now() };
    return names;
  } catch {
    return new Set();
  }
}

export async function pickGeminiModel(preferred: string, key: string): Promise<string> {
  const names = await geminiModelNames(key);
  if (names.size === 0 || names.has(preferred)) return preferred; // exact hit or can't list
  const all = Array.from(names);
  const flash = all.filter((n) => n.includes("flash"));
  const wantLite = preferred.includes("lite");
  const pool = wantLite
    ? flash.filter((n) => n.includes("lite"))
    : flash.filter((n) => !n.includes("lite"));
  const latest = (arr: string[]) => arr.find((n) => n.endsWith("-latest")) || arr[0];
  return latest(pool) || latest(flash) || all[0] || preferred;
}

export async function callGemini(
  opts: RunOptions & { model: string }
): Promise<string> {
  const key = await getKey("GEMINI_API_KEY");
  if (!key) throw new Error("Gemini key not set — add it in Settings.");
  const model = await pickGeminiModel(opts.model, key);

  // Build a single user turn: text + any images.
  const parts: any[] = [];
  if (opts.system) parts.push({ text: `${opts.system}\n\n` });
  parts.push({ text: opts.prompt });
  for (const img of opts.images || []) {
    parts.push({ inline_data: { mime_type: img.mediaType, data: img.data } });
  }
  // YouTube URL as video — Gemini watches it. Only flash+ models support this.
  if (opts.videoUrl) {
    parts.push({ file_data: { file_uri: opts.videoUrl } });
  }

  const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: opts.json
        ? { responseMimeType: "application/json" }
        : undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("\n") || "";

  return text.trim();
}

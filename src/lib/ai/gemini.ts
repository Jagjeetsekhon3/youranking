// Gemini client — thin wrapper. Called only by the router.
// Supports inline images (base64) for vision tasks like the
// Thumbnail A/B Reader. Endpoint: Generative Language API.
import { RunOptions } from "./router";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function callGemini(
  opts: RunOptions & { model: string }
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  // Build a single user turn: text + any images.
  const parts: any[] = [];
  if (opts.system) parts.push({ text: `${opts.system}\n\n` });
  parts.push({ text: opts.prompt });
  for (const img of opts.images || []) {
    parts.push({ inline_data: { mime_type: img.mediaType, data: img.data } });
  }

  const res = await fetch(`${BASE}/${opts.model}:generateContent?key=${key}`, {
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

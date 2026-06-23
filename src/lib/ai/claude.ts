// Claude client — thin wrapper. Called only by the router.
import { RunOptions } from "./router";

const API = "https://api.anthropic.com/v1/messages";

export async function callClaude(
  opts: RunOptions & { model: string }
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2000,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return opts.json ? stripFences(text) : text;
}

function stripFences(s: string) {
  return s.replace(/```json|```/g, "").trim();
}

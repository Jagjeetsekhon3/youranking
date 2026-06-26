import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";

export const runtime = "nodejs";

// Free YouTube autocomplete mining — no quota cost.
async function autocomplete(seed: string): Promise<string[]> {
  const out = new Set<string>();
  // base + a few alphabet expansions for breadth
  const probes = [seed, `${seed} `, `how to ${seed}`, `best ${seed}`, `${seed} for`];
  for (const q of probes) {
    try {
      const r = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`
      );
      const txt = await r.text();
      const arr = JSON.parse(txt);
      for (const s of arr[1] || []) out.add(s);
    } catch { /* ignore a failed probe */ }
  }
  return Array.from(out);
}

// POST /api/keywords { seed }
export async function POST(req: NextRequest) {
  try {
    const { seed } = await req.json();
    if (!seed?.trim()) return NextResponse.json({ error: "Enter a seed keyword." }, { status: 400 });

    const suggestions = await autocomplete(seed.trim());
    if (suggestions.length === 0) {
      return NextResponse.json({ error: "No suggestions returned. Try a different seed." }, { status: 404 });
    }

    // Gemini clusters them and flags long-tail / low-competition angles.
    const system = "You organize YouTube keyword ideas. You group raw suggestions into themes and flag the long-tail, lower-competition ones worth targeting.";
    const prompt = `Seed: "${seed}"
Raw YouTube autocomplete suggestions: ${suggestions.join(" | ")}

Reply ONLY with JSON: {"clusters":[{"theme":"...","keywords":["..."]}],"longTail":["the lower-competition, more specific phrases worth targeting first"]}`;

    let organized: any = null;
    try {
      organized = JSON.parse(await run("keyword.expand", { system, prompt, json: true }));
    } catch { /* fall back to raw list */ }

    return NextResponse.json({ suggestions, ...(organized || {}) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

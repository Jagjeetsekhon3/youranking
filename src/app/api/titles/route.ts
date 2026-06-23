import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";

export const runtime = "nodejs";

// POST /api/titles  { topic: string }
// Returns 10 scored title variants. Routed to Claude (craft).
export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Add a topic first." }, { status: 400 });
    }

    const system =
      "You are a YouTube packaging expert. You write titles that earn the click without lying. " +
      "You understand curiosity gaps, specificity, numbers, and that titles must read at a glance on mobile.";

    const prompt = `Topic: "${topic}"

Generate 10 title options. For each, score it 0-100 and give a one-line reason.
Reply ONLY with JSON, no markdown, in this exact shape:
{"titles":[{"title":"...","score":87,"reason":"...","length":42}]}
Keep titles under 70 characters. Vary the angles (curiosity, list, how-to, bold claim, emotional).`;

    const raw = await run("title.generate", { system, prompt, json: true });
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

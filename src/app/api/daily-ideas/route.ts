import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { dbSelect } from "@/lib/supabase";

export const runtime = "nodejs";

// POST /api/daily-ideas { niche }
// Grounds Claude in your saved Idea Bank, then generates today's fresh angles.
export async function POST(req: NextRequest) {
  try {
    const { niche } = await req.json();

    let saved: string[] = [];
    try {
      const rows = await dbSelect("ideas", "select=title,note&order=created_at.desc&limit=25");
      saved = rows.map((r: any) => r.title);
    } catch { /* supabase optional */ }

    const system =
      "You are a YouTube content strategist. You generate concrete, makeable video ideas — not vague themes. " +
      "Each idea has a clear title-shaped concept and a reason it would travel. You avoid repeating what's already saved.";

    const prompt = `Niche/channel focus: ${niche || "general creator growth"}
Ideas already in my bank (don't repeat these): ${saved.length ? saved.join(" | ") : "none yet"}

Generate today's 8 fresh video ideas for this creator.
Reply ONLY with JSON: {"ideas":[{"title":"a click-worthy title","angle":"the specific take/format","why":"why it would perform now"}]}`;

    const raw = await run("ideas.daily", { system, prompt, json: true });
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

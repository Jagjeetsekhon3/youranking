import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { extractVideoId, getVideoFull } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/hook { url, format: "shorts" | "long" }
export async function POST(req: NextRequest) {
  try {
    const { url, format = "shorts" } = await req.json();
    const id = extractVideoId(url || "");
    if (!id) return NextResponse.json({ error: "Paste a valid YouTube URL." }, { status: 400 });

    const v = await getVideoFull(id);
    if (!v) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const window = format === "shorts" ? "first 1–2 seconds" : "first 15 seconds";
    const watchUrl = `https://www.youtube.com/watch?v=${id}`;

    // 1. Gemini WATCHES the opening and reports what actually happens.
    const analyzeSystem =
      "You are a retention analyst. You watch the opening of a video and describe, precisely and " +
      "honestly, what happens and why it does or doesn't grab attention immediately.";
    const analyzePrompt = `Watch the ${window} of this video (title: "${v.title}").
Reply ONLY with JSON: {"hookScore":0-100,"whatHappens":"precise beat-by-beat of the opening","problems":["specific issues killing retention"]}`;

    let analysis: any;
    try {
      const raw = await run("hook.analyze", { system: analyzeSystem, prompt: analyzePrompt, videoUrl: watchUrl, json: true });
      analysis = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Couldn't analyse this video (it may be too long or private). Try a short, public video." }, { status: 422 });
    }

    // 2. Claude CRAFTS stronger openings from Gemini's readout.
    const rewriteSystem =
      "You are a short-form retention writer. You write opening hooks that stop the scroll in the " +
      "first second — pattern interrupts, open loops, bold claims, visual surprises. No clickbait lies.";
    const rewritePrompt = `Video: "${v.title}"
What the opening currently does: ${analysis.whatHappens}
Problems: ${(analysis.problems || []).join("; ")}

Write 3 stronger ${format === "shorts" ? "first-2-second" : "first-15-second"} hook concepts.
Reply ONLY with JSON: {"rewrites":[{"hook":"what to say/show","why":"why it holds"}],"retentionTips":["2-3 quick wins beyond the hook"]}`;

    const rewriteRaw = await run("hook.rewrite", { system: rewriteSystem, prompt: rewritePrompt, json: true });
    const rewrite = JSON.parse(rewriteRaw);

    return NextResponse.json({
      hookScore: analysis.hookScore,
      whatHappens: analysis.whatHappens,
      problems: analysis.problems || [],
      rewrites: rewrite.rewrites || [],
      retentionTips: rewrite.retentionTips || [],
      video: { id, title: v.title, thumb: v.thumb },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

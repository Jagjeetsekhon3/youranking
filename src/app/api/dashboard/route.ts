import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { dbSelect, dbUpsert } from "@/lib/supabase";

export const runtime = "nodejs";

const today = () => new Date().toISOString().slice(0, 10);

async function getSetting(key: string): Promise<string | undefined> {
  const r = await dbSelect("settings", `key=eq.${key}&select=value`).catch(() => []);
  return r[0]?.value;
}
async function setSetting(key: string, value: string) {
  await dbUpsert("settings", [{ key, value }], "key").catch(() => {});
}

// GET /api/dashboard?force=1&niche=...
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force");
  const nicheParam = url.searchParams.get("niche")?.trim();

  let recent: { title: string; note?: string }[] = [];
  try { recent = await dbSelect("ideas", "select=title,note&order=created_at.desc&limit=6"); } catch { /* supabase optional */ }

  let niche = nicheParam || (await getSetting("DASHBOARD_NICHE")) || "";
  if (nicheParam) await setSetting("DASHBOARD_NICHE", nicheParam);

  // Daily cache: regenerate only when stale, forced, or niche changed.
  let cached: any = null;
  try { const raw = await getSetting("DASHBOARD_IDEAS"); if (raw) cached = JSON.parse(raw); } catch { /* */ }
  const stale = !cached || cached.date !== today() || cached.niche !== niche;

  let ideas: any[] = [];
  if (!stale && !force) {
    ideas = cached.ideas;
  } else {
    try {
      const system =
        "You are a YouTube content strategist. You generate concrete, makeable video ideas — not vague themes. " +
        "Each has a click-worthy title concept and a sharp reason it would travel.";
      const prompt = `Niche/focus: ${niche || "general creator growth"}
Already saved (don't repeat): ${recent.map((r) => r.title).join(" | ") || "none"}
Generate 4 fresh ideas for today.
Reply ONLY with JSON: {"ideas":[{"title":"...","angle":"...","why":"..."}]}`;
      const data = JSON.parse(await run("ideas.daily", { system, prompt, json: true }));
      ideas = (data.ideas || []).slice(0, 4);
      await setSetting("DASHBOARD_IDEAS", JSON.stringify({ date: today(), niche, ideas }));
    } catch { ideas = cached?.ideas || []; }
  }

  return NextResponse.json({ ideas, recent, niche });
}

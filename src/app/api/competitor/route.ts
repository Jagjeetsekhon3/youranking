import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { resolveChannelId, getChannelRecentVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/competitor { competitors: string[], mine?: string }
export async function POST(req: NextRequest) {
  try {
    const { competitors, mine } = await req.json();
    const list: string[] = (competitors || []).filter((s: string) => s?.trim()).slice(0, 3);
    if (list.length === 0) {
      return NextResponse.json({ error: "Add at least one competitor channel (@handle or URL)." }, { status: 400 });
    }

    // Pull each competitor's recent videos (with view counts).
    const rivals: { name: string; subs: number; topVideos: { title: string; views: number }[] }[] = [];
    for (const c of list) {
      const id = await resolveChannelId(c);
      if (!id) continue;
      const { title, subs, videos } = await getChannelRecentVideos(id, 15);
      const topVideos = videos
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map((v) => ({ title: v.title, views: v.views }));
      rivals.push({ name: title || c, subs, topVideos });
    }
    if (rivals.length === 0) {
      return NextResponse.json({ error: "Couldn't resolve those channels. Use @handles or channel URLs." }, { status: 404 });
    }

    // Optional: the user's own channel, for true gap comparison.
    let mineData: { name: string; topVideos: string[] } | null = null;
    if (mine?.trim()) {
      const id = await resolveChannelId(mine);
      if (id) {
        const { title, videos } = await getChannelRecentVideos(id, 20);
        mineData = { name: title || mine, topVideos: videos.map((v) => v.title) };
      }
    }

    const system =
      "You are a YouTube competitive strategist. You find the topics rivals are winning with and " +
      "identify gaps — themes that work for them but the user hasn't covered, or could do better.";

    const prompt = `RIVALS AND THEIR TOP RECENT VIDEOS (by views):
${rivals.map((r) => `\n${r.name} (${r.subs} subs):\n${r.topVideos.map((v) => `  - ${v.title} (${v.views} views)`).join("\n")}`).join("\n")}
${mineData ? `\n\nMY CHANNEL (${mineData.name}) RECENT VIDEOS:\n${mineData.topVideos.map((t) => `  - ${t}`).join("\n")}` : "\n\n(No own channel given — surface the most repeatable winning topics.)"}

Reply ONLY with JSON:
{"winningThemes":[{"theme":"...","evidence":"which rival videos prove it","why":"why it works"}],"gaps":[{"idea":"a specific video idea I should make","reason":"why it's an opening for me"}]}
Give 3-4 winningThemes and 4-5 concrete gaps.`;

    const raw = await run("competitor.gap", { system, prompt, json: true });
    const data = JSON.parse(raw);
    return NextResponse.json({ ...data, rivals: rivals.map((r) => ({ name: r.name, subs: r.subs })) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

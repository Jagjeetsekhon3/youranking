import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { searchVideoIds, getVideos, getChannels } from "@/lib/youtube";

export const runtime = "nodejs";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// POST /api/niche { niche, region?, format? }
// One search (100u) + batched stats (2u) ≈ 102u, same as Outlier Finder.
export async function POST(req: NextRequest) {
  try {
    const { niche, region = "", format = "any" } = await req.json();
    if (!niche?.trim()) {
      return NextResponse.json({ error: "Enter a niche to assess." }, { status: 400 });
    }

    const duration = format === "shorts" ? "short" : format === "long" ? "long" : "any";
    const ids = await searchVideoIds({ query: niche, order: "viewCount", region, duration, max: 50 });
    if (ids.length === 0) {
      return NextResponse.json({ error: "No videos found — try a broader niche." }, { status: 404 });
    }

    const videos = await getVideos(ids);
    const channels = await getChannels(videos.map((v) => v.channelId));

    // Real signals from the data.
    const views = videos.map((v) => v.views);
    const subsArr = videos
      .map((v) => channels.get(v.channelId)?.subs)
      .filter((n): n is number => typeof n === "number" && n > 0);
    const beatable = videos.filter((v) => {
      const s = channels.get(v.channelId)?.subs ?? 0;
      return s > 0 && v.views > s;
    }).length;
    const fresh = videos.filter(
      (v) => Date.now() - new Date(v.publishedAt).getTime() < 90 * 864e5
    ).length;

    const signals = {
      medianViews: median(views),
      medianSubs: median(subsArr),
      beatablePct: Math.round((beatable / videos.length) * 100),
      freshPct: Math.round((fresh / videos.length) * 100),
      sampleTitles: videos.slice(0, 10).map((v) => v.title),
    };

    const system =
      "You are a YouTube niche strategist. You assess whether a niche is worth entering by " +
      "weighing real demand against beatable competition. You know RPM varies hugely by niche " +
      "(finance/tech high, gaming/entertainment lower) and you give honest, specific reads.";

    const prompt = `Assess this niche using REAL data from a 50-video scan.

NICHE: ${niche}
REGION: ${region || "worldwide"}
FORMAT: ${format}

REAL SIGNALS:
- median views of top results: ${signals.medianViews}
- median subscribers of ranking channels: ${signals.medianSubs}
- % of top videos that beat their channel's sub count (beatability): ${signals.beatablePct}%
- % of top videos published in last 90 days (momentum): ${signals.freshPct}%
- sample titles: ${signals.sampleTitles.join(" | ")}

High beatability = small channels can rank, so it's crackable. High freshness = active/growing.
Big median subs = entrenched competition.

Reply ONLY with JSON, no markdown:
{"demand":0-100,"competition":0-100,"opportunity":0-100,"momentum":"rising|steady|fading","rpm":{"tier":"low|medium|high","estimate":"e.g. $2-5","note":"why"},"verdict":"2 sentences, honest","subNiches":[{"name":"...","angle":"the content angle","why":"why it's open"}]}
Give 3-4 subNiches that are less saturated entry points within this niche.`;

    const raw = await run("niche.score", { system, prompt, json: true });
    const data = JSON.parse(raw);

    return NextResponse.json({ ...data, signals, quotaUsed: 102 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

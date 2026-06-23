import { NextRequest, NextResponse } from "next/server";
import { searchVideoIds, getVideos, getChannels } from "@/lib/youtube";
import { scoreOutliers } from "@/lib/outlier";

export const runtime = "nodejs";

// POST /api/outliers { query, days?, order? }
// One scan = 1 search (100u) + 1 videos.list (1u) + 1 channels.list (1u) ≈ 102u.
export async function POST(req: NextRequest) {
  try {
    const { query, days = 90, order = "relevance" } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Enter a niche or topic to scan." }, { status: 400 });
    }

    // 1. expensive step, isolated: get candidate ids (100u)
    const ids = await searchVideoIds({ query, days, order, max: 50 });
    if (ids.length === 0) {
      return NextResponse.json({ outliers: [], quotaUsed: 100, note: "No videos found for that query/window." });
    }

    // 2. cheap, batched: stats + channel subs (1u + 1u)
    const videos = await getVideos(ids);
    const channelIds = videos.map((v) => v.channelId);
    const channels = await getChannels(channelIds);

    // 3. score + rank
    const outliers = scoreOutliers(videos, channels);
    const quotaUsed = 100 + Math.ceil(ids.length / 50) + Math.ceil(channelIds.length / 50);

    return NextResponse.json({ outliers, quotaUsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

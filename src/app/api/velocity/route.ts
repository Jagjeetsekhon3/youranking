import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, getVideos } from "@/lib/youtube";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabase";

export const runtime = "nodejs";

// GET — tracked videos with velocity (views/day) from their snapshots
export async function GET() {
  try {
    const tracked = await dbSelect("tracked_videos", "select=*&order=added_at.desc");
    const snaps = await dbSelect("video_snapshots", "select=video_id,views,taken_at&order=taken_at.asc");

    const byVideo: Record<string, { views: number; taken_at: string }[]> = {};
    for (const s of snaps) (byVideo[s.video_id] ||= []).push(s);

    const rows = tracked.map((v: any) => {
      const series = byVideo[v.id] || [];
      let velocity = 0;
      let latest = 0;
      if (series.length >= 2) {
        const first = series[0], last = series[series.length - 1];
        const days = Math.max((+new Date(last.taken_at) - +new Date(first.taken_at)) / 864e5, 0.5);
        velocity = Math.round((last.views - first.views) / days);
        latest = last.views;
      } else if (series.length === 1) {
        latest = series[0].views;
      }
      return { ...v, latest, velocity, points: series.length };
    });
    rows.sort((a: any, b: any) => b.velocity - a.velocity);
    return NextResponse.json({ tracked: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST { url } — start tracking a video (records first snapshot immediately)
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const id = extractVideoId(url || "");
    if (!id) return NextResponse.json({ error: "Paste a valid video URL." }, { status: 400 });

    const [v] = await getVideos([id]);
    if (!v) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    await dbInsert("tracked_videos", { id, title: v.title, channel: v.channelTitle, thumb: v.thumb }).catch(() => {});
    await dbInsert("video_snapshots", { video_id: id, views: v.views });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE ?id= — stop tracking
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDelete("tracked_videos", `id=eq.${id}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

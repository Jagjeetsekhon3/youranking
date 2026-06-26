import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/youtube";
import { dbSelect, dbInsert } from "@/lib/supabase";

export const runtime = "nodejs";

// GET /api/cron/snapshot  — called by Vercel Cron daily.
// Protect with a secret so randoms can't trigger it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const tracked = await dbSelect("tracked_videos", "select=id");
    const ids = tracked.map((t: any) => t.id);
    if (ids.length === 0) return NextResponse.json({ ok: true, snapped: 0 });

    const videos = await getVideos(ids); // batched, 1 unit per 50
    for (const v of videos) {
      await dbInsert("video_snapshots", { video_id: v.id, views: v.views }).catch(() => {});
    }
    return NextResponse.json({ ok: true, snapped: videos.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

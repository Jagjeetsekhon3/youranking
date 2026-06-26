import { NextRequest, NextResponse } from "next/server";
import { accessToken, isConnected } from "@/lib/google-oauth";

export const runtime = "nodejs";

const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";
const DATA = "https://www.googleapis.com/youtube/v3";

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

async function authedGet(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

// GET /api/analytics — connection state + overview
export async function GET() {
  try {
    if (!(await isConnected())) return NextResponse.json({ connected: false });
    const token = await accessToken();

    // Channel basics + recent uploads
    const ch = await authedGet(`${DATA}/channels?part=snippet,statistics,contentDetails&mine=true`, token);
    const c = ch.items?.[0];
    const uploads = c?.contentDetails?.relatedPlaylists?.uploads;
    let recent: { id: string; title: string; thumb: string }[] = [];
    if (uploads) {
      const pl = await authedGet(`${DATA}/playlistItems?part=snippet,contentDetails&playlistId=${uploads}&maxResults=10`, token);
      recent = (pl.items || []).map((i: any) => ({
        id: i.contentDetails?.videoId,
        title: i.snippet?.title,
        thumb: i.snippet?.thumbnails?.medium?.url,
      }));
    }

    const end = new Date();
    const start = new Date(Date.now() - 90 * 864e5);

    // Best day of week (aggregate daily views by weekday)
    let bestDay = "—";
    try {
      const rep = await authedGet(
        `${ANALYTICS}?ids=channel==MINE&startDate=${ymd(start)}&endDate=${ymd(end)}&metrics=views&dimensions=day&sort=day`,
        token
      );
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const tally = [0, 0, 0, 0, 0, 0, 0];
      for (const row of rep.rows || []) tally[new Date(row[0]).getDay()] += row[1];
      const max = Math.max(...tally);
      if (max > 0) bestDay = days[tally.indexOf(max)];
    } catch { /* ignore */ }

    // Revenue / RPM last 28d (needs monetized channel + monetary scope)
    let revenue: any = null;
    try {
      const start28 = new Date(Date.now() - 28 * 864e5);
      const rep = await authedGet(
        `${ANALYTICS}?ids=channel==MINE&startDate=${ymd(start28)}&endDate=${ymd(end)}&metrics=estimatedRevenue,playbackBasedCpm,monetizedPlaybacks`,
        token
      );
      const row = rep.rows?.[0];
      if (row) revenue = { estimatedRevenue: row[0], playbackCpm: row[1], monetizedPlaybacks: row[2] };
    } catch { /* not monetized or no monetary access */ }

    return NextResponse.json({
      connected: true,
      channel: { title: c?.snippet?.title, subs: Number(c?.statistics?.subscriberCount ?? 0), views: Number(c?.statistics?.viewCount ?? 0) },
      bestDay, revenue, recent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST { video } — audience retention curve for one of your videos
export async function POST(req: NextRequest) {
  try {
    const { video } = await req.json();
    if (!video) return NextResponse.json({ error: "video id required" }, { status: 400 });
    const token = await accessToken();

    const end = new Date();
    const start = new Date(Date.now() - 365 * 864e5);
    const rep = await authedGet(
      `${ANALYTICS}?ids=channel==MINE&startDate=${ymd(start)}&endDate=${ymd(end)}&metrics=audienceWatchRatio,relativeRetentionPerformance&dimensions=elapsedVideoTimeRatio&filters=video==${video}&sort=elapsedVideoTimeRatio`,
      token
    );
    const curve = (rep.rows || []).map((r: any) => ({ at: r[0], watchRatio: r[1] }));
    return NextResponse.json({ curve });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

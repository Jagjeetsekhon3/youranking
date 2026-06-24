// ──────────────────────────────────────────────────────────────
// YouTube Data API v3 client — quota-aware by design.
// Costs: search.list = 100 units. videos.list / channels.list = 1
// unit each, and BOTH batch up to 50 ids per call. So we search
// once, then batch everything else. One scan ≈ 102 units.
// ──────────────────────────────────────────────────────────────

const BASE = "https://www.googleapis.com/youtube/v3";

import { getKey } from "./settings";

// Pull an 11-char video id out of any YouTube URL (0 quota — free).
export function extractVideoId(url: string): string | null {
  return url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? null;
}

async function get(path: string, params: Record<string, string>) {
  const k = await getKey("YOUTUBE_API_KEY");
  if (!k) throw new Error("YouTube key not set — add it in Settings.");
  const qs = new URLSearchParams({ ...params, key: k }).toString();
  const res = await fetch(`${BASE}/${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403 && body.includes("quota"))
      throw new Error("YouTube daily quota exhausted — resets midnight Pacific.");
    throw new Error(`YouTube ${res.status}: ${body}`);
  }
  return res.json();
}

export interface SearchOpts {
  query: string;
  days?: number;     // recency window — outliers should be fresh
  order?: "relevance" | "viewCount" | "date";
  max?: number;      // up to 50 per search call
}

// COSTS 100 UNITS. Returns up to 50 video ids. Call sparingly + cache.
export async function searchVideoIds(o: SearchOpts): Promise<string[]> {
  const params: Record<string, string> = {
    part: "id",
    type: "video",
    q: o.query,
    maxResults: String(o.max ?? 50),
    order: o.order ?? "relevance",
  };
  if (o.days) {
    const since = new Date(Date.now() - o.days * 864e5).toISOString();
    params.publishedAfter = since;
  }
  const data = await get("search", params);
  return (data.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
}

export interface VideoStat {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  views: number;
  thumb: string;
}

// 1 unit per 50 ids. Batches automatically.
export async function getVideos(ids: string[]): Promise<VideoStat[]> {
  const out: VideoStat[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await get("videos", {
      part: "snippet,statistics",
      id: chunk.join(","),
    });
    for (const v of data.items || []) {
      out.push({
        id: v.id,
        title: v.snippet?.title ?? "",
        channelId: v.snippet?.channelId ?? "",
        channelTitle: v.snippet?.channelTitle ?? "",
        publishedAt: v.snippet?.publishedAt ?? "",
        views: Number(v.statistics?.viewCount ?? 0),
        thumb: v.snippet?.thumbnails?.medium?.url ?? "",
      });
    }
  }
  return out;
}

export interface ChannelStat {
  id: string;
  subs: number;
  hidden: boolean;
}

// 1 unit per 50 ids. Gives subscriber count for the outlier ratio.
export async function getChannels(ids: string[]): Promise<Map<string, ChannelStat>> {
  const map = new Map<string, ChannelStat>();
  const unique = Array.from(new Set(ids));
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const data = await get("channels", {
      part: "statistics",
      id: chunk.join(","),
    });
    for (const c of data.items || []) {
      map.set(c.id, {
        id: c.id,
        subs: Number(c.statistics?.subscriberCount ?? 0),
        hidden: Boolean(c.statistics?.hiddenSubscriberCount),
      });
    }
  }
  return map;
}

export interface VideoFull extends VideoStat {
  description: string;
  tags: string[];
  duration: string; // ISO 8601, e.g. PT10M30S
}

// Full detail for one video (snippet + stats + contentDetails). 1 unit.
export async function getVideoFull(id: string): Promise<VideoFull | null> {
  const data = await get("videos", {
    part: "snippet,statistics,contentDetails",
    id,
  });
  const v = (data.items || [])[0];
  if (!v) return null;
  return {
    id: v.id,
    title: v.snippet?.title ?? "",
    channelId: v.snippet?.channelId ?? "",
    channelTitle: v.snippet?.channelTitle ?? "",
    publishedAt: v.snippet?.publishedAt ?? "",
    views: Number(v.statistics?.viewCount ?? 0),
    thumb: v.snippet?.thumbnails?.medium?.url ?? "",
    description: v.snippet?.description ?? "",
    tags: v.snippet?.tags ?? [],
    duration: v.contentDetails?.duration ?? "",
  };
}

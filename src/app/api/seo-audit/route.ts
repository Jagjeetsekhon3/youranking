import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { extractVideoId, getVideoFull } from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 60; // video analysis can take a while

// crude chapter detection: ≥3 timestamps and a 0:00 in the description
function hasChapters(desc: string): boolean {
  const stamps = desc.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g) || [];
  return stamps.length >= 3 && /\b0:00\b/.test(desc);
}

// POST /api/seo-audit { url }
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const id = extractVideoId(url || "");
    if (!id) {
      return NextResponse.json({ error: "Paste a valid YouTube video URL." }, { status: 400 });
    }

    const v = await getVideoFull(id);
    if (!v) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    const signals = {
      titleLength: v.title.length,
      descLength: v.description.length,
      tagCount: v.tags.length,
      hasChapters: hasChapters(v.description),
      firstTwoLines: v.description.split("\n").slice(0, 2).join(" ").slice(0, 200),
    };

    const system =
      "You are a YouTube SEO and packaging auditor for 2026. You know tags barely matter now, " +
      "that title + thumbnail + hook drive the click and the watch, and that the first 25 words of " +
      "the description and chapters still help. Be specific and honest, never generic.";

    const prompt = `Audit this video.

TITLE: ${v.title}
CHANNEL: ${v.channelTitle}
VIEWS: ${v.views}
DURATION: ${v.duration}
DESCRIPTION (first 200 chars): ${signals.firstTwoLines}
TAG COUNT: ${signals.tagCount}
CHAPTERS PRESENT: ${signals.hasChapters}
TITLE LENGTH: ${signals.titleLength} chars

If a video is attached, WATCH it and judge the hook (first 15s), pacing, and whether the
content delivers what the title/thumbnail promise. If no video is attached, audit from metadata only.

Reply ONLY with JSON, no markdown:
{"score":0-100,"breakdown":[{"area":"Title|Thumbnail|Hook|Description|Chapters|Packaging","score":0-100,"finding":"what's true now","fix":"one specific action"}],"hook":"one-line read on the opening (or 'not analysed' if no video)","summary":"2 sentences: the single biggest win available"}`;

    const watchUrl = `https://www.youtube.com/watch?v=${id}`;
    let raw: string;
    let videoAnalyzed = true;

    // Try with the video first; fall back to metadata-only if ingestion fails.
    try {
      raw = await run("seo.audit", { system, prompt, videoUrl: watchUrl, json: true });
    } catch {
      videoAnalyzed = false;
      raw = await run("seo.audit", { system, prompt, json: true });
    }

    const data = JSON.parse(raw);
    return NextResponse.json({
      ...data,
      videoAnalyzed,
      video: { id, title: v.title, channelTitle: v.channelTitle, views: v.views, thumb: v.thumb },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

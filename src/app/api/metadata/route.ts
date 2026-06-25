import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";
import { extractVideoId, getVideoFull } from "@/lib/youtube";

export const runtime = "nodejs";

// POST /api/metadata { topic } OR { url }
export async function POST(req: NextRequest) {
  try {
    const { topic, url } = await req.json();

    let context = topic?.trim();
    if (!context && url) {
      const id = extractVideoId(url);
      if (id) {
        const v = await getVideoFull(id);
        if (v) context = `${v.title}\n${v.description.slice(0, 300)}`;
      }
    }
    if (!context) {
      return NextResponse.json({ error: "Enter a topic or a video URL." }, { status: 400 });
    }

    const system =
      "You write YouTube descriptions and tags that help discovery without keyword-stuffing. " +
      "You front-load the main keyword in the first sentence, keep it readable, and pick relevant tags.";

    const prompt = `Topic / video: ${context}

Produce optimized metadata.
Reply ONLY with JSON:
{"description":"3-4 short paragraphs; main keyword in the first sentence; natural, not stuffed","tags":["8-12 relevant tags"],"hashtags":["3-5 hashtags"]}`;

    const raw = await run("tags.generate", { system, prompt, json: true });
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

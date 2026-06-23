import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/ai/router";

export const runtime = "nodejs";

// POST /api/thumbnails  { images: [{mediaType, data(base64)}] }
// 2-3 thumbnails in, side-by-side read out. Routed to Gemini (vision).
// Nothing is stored — images are held only for this request.
export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length < 2) {
      return NextResponse.json(
        { error: "Upload at least 2 thumbnails to compare." },
        { status: 400 }
      );
    }

    const system =
      "You are a YouTube thumbnail strategist. You judge thumbnails the way the algorithm's audience does: " +
      "in a fraction of a second, at phone size, in a crowded feed.";

    const prompt = `I'm giving you ${images.length} thumbnails labelled A, B${
      images.length > 2 ? ", C" : ""
    } in order.
Judge each on: click appeal, clarity at small size, text legibility, focal point / emotion, contrast & feed standout.
Then pick a winner and give the losers 1-2 concrete fixes.
Reply ONLY with JSON, no markdown, in this exact shape:
{"thumbnails":[{"label":"A","clickAppeal":0-100,"clarity":0-100,"legibility":0-100,"focalPoint":"...","standout":"...","overall":0-100}],"winner":"A","verdict":"one or two sentences","fixes":["..."]}`;

    const raw = await run("thumbnail.read", {
      system,
      prompt,
      images,
      json: true,
    });
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

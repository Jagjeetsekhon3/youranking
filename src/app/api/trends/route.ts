import { NextRequest, NextResponse } from "next/server";
import { getKey } from "@/lib/settings";

export const runtime = "nodejs";

// POST /api/trends { term, region }
// Uses SerpApi's Google Trends engine with the YouTube property (gprop=youtube)
// — the YouTube-specific signal, not generic web search.
export async function POST(req: NextRequest) {
  try {
    const { term, region = "" } = await req.json();
    if (!term?.trim()) return NextResponse.json({ error: "Enter a topic." }, { status: 400 });

    const key = await getKey("SERPAPI_KEY");
    if (!key) {
      return NextResponse.json(
        { error: "Add a SerpApi key in Settings (free 250/mo tier is enough)." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      engine: "google_trends",
      q: term,
      data_type: "TIMESERIES",
      gprop: "youtube",
      api_key: key,
    });
    if (region) params.set("geo", region);

    const r = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await r.json();
    if (data.error) return NextResponse.json({ error: data.error }, { status: 502 });

    const timeline = (data.interest_over_time?.timeline_data || []).map((t: any) => ({
      date: t.date,
      value: t.values?.[0]?.extracted_value ?? 0,
    }));

    // simple direction read from last third vs first third
    let direction = "steady";
    if (timeline.length >= 6) {
      const third = Math.floor(timeline.length / 3);
      const early = avg(timeline.slice(0, third).map((p: any) => p.value));
      const late = avg(timeline.slice(-third).map((p: any) => p.value));
      if (late > early * 1.2) direction = "rising";
      else if (late < early * 0.8) direction = "fading";
    }

    return NextResponse.json({ timeline, direction });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function avg(a: number[]) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }

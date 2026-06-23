import { NextRequest, NextResponse } from "next/server";
import { dbUpsert, SUPABASE_READY } from "@/lib/supabase";
import { keyStatus, bustCache, getKey, MANAGED_KEYS } from "@/lib/settings";

export const runtime = "nodejs";

// GET /api/settings — masked status for each managed key.
export async function GET() {
  try {
    const keys = await keyStatus();
    return NextResponse.json({ keys, supabaseReady: SUPABASE_READY });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/settings  { save: {NAME: value, ...} }  or  { test: "ANTHROPIC_API_KEY" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.save) {
      const rows = Object.entries(body.save)
        .filter(([k, v]) => MANAGED_KEYS.includes(k as any) && typeof v === "string" && v.trim())
        .map(([key, value]) => ({ key, value }));
      if (rows.length === 0) {
        return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
      }
      await dbUpsert("settings", rows, "key");
      bustCache();
      return NextResponse.json({ ok: true, saved: rows.map((r) => r.key) });
    }

    if (body.test) {
      const result = await testProvider(body.test);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Live ping per provider. Cheap calls only (YouTube = 1 unit).
async function testProvider(name: string): Promise<{ ok: boolean; detail: string }> {
  const key = await getKey(name);
  if (!key) return { ok: false, detail: "No key set." };

  try {
    if (name === "ANTHROPIC_API_KEY") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      });
      return r.ok ? { ok: true, detail: "Connected" } : { ok: false, detail: `HTTP ${r.status}` };
    }
    if (name === "GEMINI_API_KEY") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${key}`,
        { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi" }] }], generationConfig: { maxOutputTokens: 1 } }) }
      );
      return r.ok ? { ok: true, detail: "Connected" } : { ok: false, detail: `HTTP ${r.status}` };
    }
    if (name === "YOUTUBE_API_KEY") {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${key}`
      );
      return r.ok ? { ok: true, detail: "Connected (1 unit)" } : { ok: false, detail: `HTTP ${r.status}` };
    }
    return { ok: false, detail: "Unknown provider." };
  } catch (e: any) {
    return { ok: false, detail: e.message };
  }
}

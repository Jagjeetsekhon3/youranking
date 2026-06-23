import { NextRequest, NextResponse } from "next/server";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabase";

export const runtime = "nodejs";

// GET /api/ideas — list saved ideas
export async function GET() {
  try {
    const rows = await dbSelect("ideas", "select=*&order=created_at.desc");
    return NextResponse.json({ ideas: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/ideas { title, note, source_url }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title required." }, { status: 400 });
    }
    const row = await dbInsert("ideas", {
      title: body.title,
      note: body.note ?? null,
      source_url: body.source_url ?? null,
    });
    return NextResponse.json({ idea: row[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/ideas?id=uuid
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDelete("ideas", `id=eq.${id}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

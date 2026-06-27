import { NextRequest, NextResponse } from "next/server";
import { listChannels, activeChannelId, setActive, removeChannel } from "@/lib/google-oauth";

export const runtime = "nodejs";

// GET — connected channels + which is active (never returns tokens)
export async function GET() {
  try {
    const channels = await listChannels();
    const active = await activeChannelId();
    return NextResponse.json({ channels, active });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST { id } — switch active channel
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await setActive(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE ?id= — remove a channel
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await removeChannel(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

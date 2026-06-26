import { NextRequest, NextResponse } from "next/server";
import { authUrl } from "@/lib/google-oauth";

export const runtime = "nodejs";

// GET /api/oauth/start — kick off Google consent
export async function GET(req: NextRequest) {
  try {
    return NextResponse.redirect(authUrl(req.nextUrl.origin));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

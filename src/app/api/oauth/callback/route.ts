import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/google-oauth";

export const runtime = "nodejs";

// GET /api/oauth/callback?code=... — Google redirects here
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const err = req.nextUrl.searchParams.get("error");
  const home = new URL("/my-channel", req.nextUrl.origin);
  if (err || !code) {
    home.searchParams.set("oauth", "error");
    return NextResponse.redirect(home);
  }
  try {
    await exchangeCode(code, req.nextUrl.origin);
    home.searchParams.set("oauth", "ok");
  } catch {
    home.searchParams.set("oauth", "error");
  }
  return NextResponse.redirect(home);
}

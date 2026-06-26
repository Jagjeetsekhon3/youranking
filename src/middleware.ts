import { NextRequest, NextResponse } from "next/server";
import { COOKIE, makeToken } from "@/lib/auth";

// Public paths that must work without a session.
const PUBLIC = ["/login", "/api/auth", "/api/cron"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const password = process.env.APP_PASSWORD;
  // No password configured → app is open. Set APP_PASSWORD to lock it.
  if (!password) return NextResponse.next();

  const expected = await makeToken(password);
  const token = req.cookies.get(COOKIE)?.value;
  if (token === expected) return NextResponse.next();

  // Not authed. API → 401 JSON; pages → redirect to /login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

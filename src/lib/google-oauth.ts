// Google OAuth (3-legged) for the YouTube Analytics API — read-only.
// Client id/secret live in env (bootstrap creds, like Supabase). The
// user's refresh token is stored in the settings table after consent.

import { getKey } from "./settings";
import { dbUpsert } from "./supabase";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
].join(" ");

function cid() {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CLIENT_ID not set.");
  return v;
}
function secret() {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET not set.");
  return v;
}
const redirect = (origin: string) => `${origin}/api/oauth/callback`;

export function authUrl(origin: string): string {
  const p = new URLSearchParams({
    client_id: cid(),
    redirect_uri: redirect(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",   // get a refresh token
    prompt: "consent",        // force refresh token on re-consent
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string, origin: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cid(),
      client_secret: secret(),
      redirect_uri: redirect(origin),
      grant_type: "authorization_code",
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || "Token exchange failed.");
  if (data.refresh_token) {
    await dbUpsert("settings", [{ key: "GOOGLE_REFRESH_TOKEN", value: data.refresh_token }], "key");
  }
  return data;
}

// Exchange the stored refresh token for a fresh access token.
export async function accessToken(): Promise<string> {
  const rt = await getKey("GOOGLE_REFRESH_TOKEN");
  if (!rt) throw new Error("Channel not connected — connect it in My Channel.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cid(),
      client_secret: secret(),
      refresh_token: rt,
      grant_type: "refresh_token",
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || "Token refresh failed — reconnect your channel.");
  return data.access_token;
}

export async function isConnected(): Promise<boolean> {
  return !!(await getKey("GOOGLE_REFRESH_TOKEN"));
}

// Google OAuth (3-legged) for the YouTube Analytics API — read-only.
// Multi-channel: each connected channel stores its own refresh token in
// the `channels` table. The active channel is remembered in settings.

import { dbSelect, dbInsert, dbUpsert, dbDelete } from "./supabase";

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
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

// After consent: swap code for tokens, identify which channel it was,
// store that channel (with its refresh token), and make it active.
export async function exchangeCode(code: string, origin: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: cid(), client_secret: secret(),
      redirect_uri: redirect(origin), grant_type: "authorization_code",
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || "Token exchange failed.");

  // Identify the channel this consent was for.
  const ch = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  ).then((x) => x.json());
  const c = ch.items?.[0];
  if (!c) throw new Error("Couldn't read the channel for this account.");

  const row: any = {
    channel_id: c.id,
    title: c.snippet?.title ?? "Channel",
    thumb: c.snippet?.thumbnails?.default?.url ?? null,
  };
  // Google only returns a refresh_token on fresh consent; keep existing if absent.
  if (data.refresh_token) row.refresh_token = data.refresh_token;

  if (row.refresh_token) {
    await dbUpsert("channels", [row], "channel_id");
  } else {
    // no new token and channel may be new → can't store without a token
    const existing = await dbSelect("channels", `channel_id=eq.${c.id}&select=channel_id`);
    if (existing.length === 0) throw new Error("Google didn't return a refresh token — remove the app under Google account access, then reconnect.");
  }
  await setActive(c.id);
  return { channelId: c.id };
}

export async function listChannels(): Promise<{ id: string; title: string; thumb: string }[]> {
  const rows = await dbSelect("channels", "select=channel_id,title,thumb&order=added_at.asc");
  return rows.map((r: any) => ({ id: r.channel_id, title: r.title, thumb: r.thumb }));
}

export async function activeChannelId(): Promise<string | null> {
  const s = await dbSelect("settings", "key=eq.ACTIVE_CHANNEL&select=value").catch(() => []);
  const active = s[0]?.value;
  if (active) return active;
  const list = await listChannels();
  return list[0]?.id ?? null;
}

export async function setActive(id: string) {
  await dbUpsert("settings", [{ key: "ACTIVE_CHANNEL", value: id }], "key");
}

export async function removeChannel(id: string) {
  await dbDelete("channels", `channel_id=eq.${id}`);
  const active = await activeChannelId();
  if (active === id) {
    const list = await listChannels();
    if (list[0]) await setActive(list[0].id);
  }
}

export async function isConnected(): Promise<boolean> {
  return (await listChannels()).length > 0;
}

// Fresh access token for a given channel (or the active one).
export async function accessToken(channelId?: string): Promise<string> {
  const id = channelId || (await activeChannelId());
  if (!id) throw new Error("No channel connected — connect one in My Channel.");
  const rows = await dbSelect("channels", `channel_id=eq.${id}&select=refresh_token`);
  const rt = rows[0]?.refresh_token;
  if (!rt) throw new Error("Channel not connected — reconnect it in My Channel.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cid(), client_secret: secret(),
      refresh_token: rt, grant_type: "refresh_token",
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || "Token refresh failed — reconnect your channel.");
  return data.access_token;
}

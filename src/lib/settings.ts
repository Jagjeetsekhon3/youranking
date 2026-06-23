// ──────────────────────────────────────────────────────────────
// Key resolution. Provider keys (Claude / Gemini / YouTube) live in
// the Supabase `settings` table, editable from the Settings page.
// Env vars are the fallback. Supabase's own creds stay env-only —
// you can't store the database password inside the database.
// ──────────────────────────────────────────────────────────────

import { dbSelect } from "./supabase";

// Provider keys that the Settings page can manage.
export const MANAGED_KEYS = [
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY",
] as const;
export type ManagedKey = (typeof MANAGED_KEYS)[number];

// Small in-process cache so AI calls don't hit the DB every time.
let cache: { map: Map<string, string>; at: number } | null = null;
const TTL = 60_000;

async function load(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;
  let map = new Map<string, string>();
  try {
    const rows = await dbSelect("settings", "select=key,value");
    map = new Map(rows.map((r: any) => [r.key, r.value]));
  } catch {
    // Supabase not configured yet — fall through to env only.
  }
  cache = { map, at: Date.now() };
  return map;
}

export function bustCache() {
  cache = null;
}

// Settings table wins; env is the fallback / bootstrap.
export async function getKey(name: string): Promise<string | undefined> {
  const map = await load();
  return map.get(name) || process.env[name] || undefined;
}

// Status for the Settings page — never returns the raw key.
export async function keyStatus() {
  const map = await load();
  return MANAGED_KEYS.map((name) => {
    const fromDb = map.get(name);
    const fromEnv = process.env[name];
    const val = fromDb || fromEnv;
    return {
      name,
      set: !!val,
      source: fromDb ? "saved" : fromEnv ? "env" : "none",
      masked: val ? `…${val.slice(-4)}` : "",
    };
  });
}

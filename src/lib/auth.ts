// Single-password gate. The session cookie holds an HMAC of the
// password (never the password itself), so it can't be forged
// without knowing APP_PASSWORD. crypto.subtle works in both the
// edge middleware and node routes, so the same fn runs in both.

export const COOKIE = "yr_auth";

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("youranking-session-v1"));
  return toHex(sig);
}

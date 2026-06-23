// Supabase access via raw fetch + service role on the server.
// Bearer-token style, no SDK — same pattern that kept Vercel happy
// on your other builds, and travels cleanly to the Chrome extension.

const URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "content-type": "application/json",
  };
}

export async function dbSelect(table: string, query = "") {
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`select ${table}: ${await res.text()}`);
  return res.json();
}

export async function dbInsert(table: string, row: Record<string, unknown>) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`insert ${table}: ${await res.text()}`);
  return res.json();
}

export async function dbUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
) {
  const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert ${table}: ${await res.text()}`);
  return true;
}

export async function dbDelete(table: string, query: string) {
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`delete ${table}: ${await res.text()}`);
  return true;
}

"use client";
import { useEffect, useState } from "react";

type Status = { name: string; set: boolean; source: string; masked: string };

const LABELS: Record<string, { label: string; hint: string }> = {
  ANTHROPIC_API_KEY: { label: "Claude (Anthropic)", hint: "Titles, hooks, scripts. console.anthropic.com" },
  GEMINI_API_KEY: { label: "Gemini (Google AI)", hint: "Thumbnails, video, bulk. aistudio.google.com" },
  YOUTUBE_API_KEY: { label: "YouTube Data API v3", hint: "Outlier Finder. Google Cloud Console" },
  SERPAPI_KEY: { label: "SerpApi (optional)", hint: "Trend Radar. Free 250/mo tier at serpapi.com" },
};

export default function Settings() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [ready, setReady] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, { ok: boolean; detail: string } | "running">>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setStatuses(data.keys || []);
    setReady(data.supabaseReady !== false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setMsg("");
    const toSave = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v.trim()));
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ save: toSave }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || "Save failed."); return; }
    setInputs({});
    setMsg("Saved.");
    load();
  }

  async function test(name: string) {
    setTests((t) => ({ ...t, [name]: "running" }));
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ test: name }),
    });
    const data = await res.json();
    setTests((t) => ({ ...t, [name]: data }));
  }

  return (
    <div>
      <div className="eyebrow">Connections</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Settings</h1>
      <p className="lede">
        Keys are stored server-side in your own Supabase and never sent back to the
        browser — you only ever see the last 4 characters. Saved keys override env vars.
      </p>

      {!ready && (
        <div className="card" style={{ marginTop: 18, borderColor: "var(--bad)" }}>
          <b style={{ color: "var(--bad)" }}>Supabase not connected</b>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
            Saving keys here needs Supabase. Add <span className="mono">SUPABASE_URL</span> and{" "}
            <span className="mono">SUPABASE_SERVICE_ROLE_KEY</span> to your Vercel env, run{" "}
            <span className="mono">supabase/schema.sql</span>, then redeploy. Until then you can
            still run every feature by setting the provider keys as env vars instead.
          </p>
        </div>
      )}

      <div className="grid" style={{ marginTop: 22, gap: 14 }}>
        {statuses.map((s) => {
          const meta = LABELS[s.name];
          const t = tests[s.name];
          return (
            <div key={s.name} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: s.set ? "var(--good)" : "var(--bad)", display: "inline-block",
                  }} />
                  <b>{meta?.label || s.name}</b>
                  {s.set && (
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {s.masked} · {s.source}
                    </span>
                  )}
                </div>
                {s.set && (
                  <button className="btn ghost" onClick={() => test(s.name)} style={{ padding: "6px 12px" }}>
                    {t === "running" ? "Testing…" : "Test"}
                  </button>
                )}
              </div>

              <p className="muted" style={{ fontSize: 13, margin: "8px 0 10px" }}>{meta?.hint}</p>

              <input
                className="field" type="password"
                placeholder={s.set ? "Replace key…" : "Paste key…"}
                value={inputs[s.name] || ""}
                onChange={(e) => setInputs((i) => ({ ...i, [s.name]: e.target.value }))}
              />

              {t && t !== "running" && (
                <p style={{ fontSize: 13, marginTop: 8, color: t.ok ? "var(--good)" : "var(--bad)" }}>
                  {t.ok ? "✓ " : "✗ "}{t.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="row" style={{ marginTop: 18, gap: 12 }}>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save keys"}
        </button>
        {msg && <span className="muted">{msg}</span>}
      </div>

      <div className="card stub-note" style={{ marginTop: 24 }}>
        <p style={{ margin: 0 }}>
          <b>Supabase</b> stays in env vars (<span className="mono">SUPABASE_URL</span>,{" "}
          <span className="mono">SUPABASE_SERVICE_ROLE_KEY</span>) — the database creds
          can&rsquo;t live inside the database. Going public later: switch this to
          per-user encrypted keys (BYOK) so each user brings their own.
        </p>
      </div>
    </div>
  );
}

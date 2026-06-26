"use client";
import { useState } from "react";

type Cluster = { theme: string; keywords: string[] };
type Result = { suggestions: string[]; clusters?: Cluster[]; longTail?: string[] };

export default function Keywords() {
  const [seed, setSeed] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/keywords", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="eyebrow">Keyword research · free autocomplete</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Keyword Research</h1>
      <p className="lede">
        Mines YouTube's own autocomplete (free, no quota), then Gemini clusters it and flags
        the long-tail phrases worth targeting first. Keywords matter less than packaging in 2026 — use this for search/evergreen content.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Seed keyword, e.g. bgmi sensitivity" value={seed}
          onChange={(e) => setSeed(e.target.value)} onKeyDown={(e) => e.key === "Enter" && seed && go()} />
        <button className="btn" onClick={go} disabled={loading || !seed.trim()}>{loading ? "Mining…" : "Research"}</button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 20 }}>
          {res.longTail && res.longTail.length > 0 && (
            <div className="card" style={{ borderColor: "var(--signal)" }}>
              <div className="eyebrow">Target these first (long-tail)</div>
              <p style={{ marginTop: 10 }}>{res.longTail.map((k) => "“" + k + "”").join("  ·  ")}</p>
            </div>
          )}
          {res.clusters?.map((c, i) => (
            <div key={i} className="card" style={{ marginTop: 12 }}>
              <b>{c.theme}</b>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{c.keywords.join(" · ")}</p>
            </div>
          ))}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="eyebrow">All autocomplete hits ({res.suggestions.length})</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{res.suggestions.join(" · ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

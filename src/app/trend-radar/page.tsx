"use client";
import { useState } from "react";

type Point = { date: string; value: number };
type Result = { timeline: Point[]; direction: string };

export default function TrendRadar() {
  const [term, setTerm] = useState("");
  const [region, setRegion] = useState("IN");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/trends", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ term, region }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  const max = res ? Math.max(...res.timeline.map((p) => p.value), 1) : 1;
  const color = res?.direction === "rising" ? "var(--good)" : res?.direction === "fading" ? "var(--bad)" : "var(--mid)";

  return (
    <div>
      <div className="eyebrow">Trend direction · SerpApi (YouTube)</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Trend Radar</h1>
      <p className="lede">
        Search interest over time on the <b>YouTube property</b> specifically — the direction
        signal (rising / steady / fading), not absolute volume. Needs a SerpApi key (free tier is plenty).
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Topic, e.g. bgmi montage" value={term}
          onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && term && go()} />
        <select className="field" style={{ width: 130 }} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="IN">India</option><option value="US">US</option><option value="GB">UK</option><option value="">Worldwide</option>
        </select>
        <button className="btn" onClick={go} disabled={loading || !term.trim()}>{loading ? "Checking…" : "Scan"}</button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="eyebrow">Interest over time</div>
            <span className="score" style={{ color, background: "transparent", fontFamily: "Space Grotesk", textTransform: "uppercase" }}>{res.direction}</span>
          </div>
          <div className="row" style={{ alignItems: "flex-end", gap: 2, height: 120, marginTop: 14 }}>
            {res.timeline.map((p, i) => (
              <div key={i} title={`${p.date}: ${p.value}`}
                style={{ flex: 1, background: color, height: `${(p.value / max) * 100}%`, minHeight: 2, borderRadius: 2, opacity: 0.85 }} />
            ))}
          </div>
          <p className="mono muted" style={{ fontSize: 11, marginTop: 8 }}>
            {res.timeline.length} points · relative interest 0–100, not absolute views
          </p>
        </div>
      )}
    </div>
  );
}

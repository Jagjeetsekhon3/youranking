"use client";
import { useState } from "react";

type Sub = { name: string; angle: string; why: string };
type Result = {
  demand: number; competition: number; opportunity: number;
  momentum: string;
  rpm: { tier: string; estimate: string; note: string };
  verdict: string; subNiches: Sub[];
  signals: { medianViews: number; medianSubs: number; beatablePct: number; freshPct: number };
};

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function band(s: number) { return s >= 70 ? "good" : s >= 45 ? "mid" : "bad"; }

export default function NicheFinder() {
  const [niche, setNiche] = useState("");
  const [region, setRegion] = useState("IN");
  const [format, setFormat] = useState("any");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function scan() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/niche", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ niche, region, format }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Scan failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function save(s: Sub) {
    await fetch("/api/ideas", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: s.name, note: `niche angle: ${s.angle} — ${s.why}` }),
    });
    alert("Saved to Idea Bank");
  }

  const Tile = ({ label, val, inverted }: { label: string; val: number; inverted?: boolean }) => {
    const b = inverted ? (val >= 70 ? "bad" : val >= 45 ? "mid" : "good") : band(val);
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <div className={`score ${b}`} style={{ fontSize: 22, padding: "8px 14px" }}>{val}</div>
        <div className="mono muted" style={{ fontSize: 10, marginTop: 6 }}>{label}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="eyebrow">Opportunity scoring</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Niche Finder</h1>
      <p className="lede">
        Grounded in a real 50-video scan: demand, beatable competition, momentum, and
        RPM potential — plus less-saturated sub-niches to enter through.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10, flexWrap: "wrap" }}>
        <input className="field" placeholder="e.g. mobile gaming, budget travel India"
          value={niche} onChange={(e) => setNiche(e.target.value)} style={{ minWidth: 240, flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && niche && scan()} />
        <select className="field" style={{ width: 130 }} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="IN">India</option>
          <option value="US">US</option>
          <option value="GB">UK</option>
          <option value="">Worldwide</option>
        </select>
        <select className="field" style={{ width: 130 }} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="any">Any length</option>
          <option value="long">Long-form</option>
          <option value="shorts">Shorts</option>
        </select>
        <button className="btn" onClick={scan} disabled={loading || !niche.trim()}>
          {loading ? "Scanning…" : "Assess"}
        </button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 22 }}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <Tile label="DEMAND" val={res.demand} />
            <Tile label="COMPETITION" val={res.competition} inverted />
            <Tile label="OPPORTUNITY" val={res.opportunity} />
          </div>

          <div className="card" style={{ marginTop: 12, borderColor: "var(--signal)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">Verdict</div>
              <span className="mono muted" style={{ fontSize: 12 }}>
                momentum: {res.momentum} · RPM {res.rpm.tier} ({res.rpm.estimate})
              </span>
            </div>
            <p style={{ margin: "8px 0 0" }}>{res.verdict}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{res.rpm.note}</p>
            <p className="mono muted" style={{ fontSize: 11, marginTop: 10 }}>
              real signals → median {fmt(res.signals.medianViews)} views · median {fmt(res.signals.medianSubs)} subs ·
              {" "}{res.signals.beatablePct}% beatable · {res.signals.freshPct}% fresh
            </p>
          </div>

          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Sub-niches to enter through</h3>
          <div className="grid">
            {res.subNiches.map((s, i) => (
              <div key={i} className="card row" style={{ justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{s.angle}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{s.why}</div>
                </div>
                <button className="btn ghost" onClick={() => save(s)} style={{ padding: "8px 12px", flexShrink: 0 }}>Save</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";

type Theme = { theme: string; evidence: string; why: string };
type Gap = { idea: string; reason: string };
type Result = { winningThemes: Theme[]; gaps: Gap[]; rivals: { name: string; subs: number }[] };

export default function CompetitorGap() {
  const [c1, setC1] = useState(""); const [c2, setC2] = useState(""); const [c3, setC3] = useState("");
  const [mine, setMine] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/competitor", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ competitors: [c1, c2, c3], mine }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function save(g: Gap) {
    await fetch("/api/ideas", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: g.idea, note: `gap: ${g.reason}` }),
    });
    alert("Saved to Idea Bank");
  }

  return (
    <div>
      <div className="eyebrow">Idea discovery</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Competitor Gap</h1>
      <p className="lede">
        Add rival channels (@handle or URL). See the topics they're winning with — and the
        gaps you can walk into. Add your own channel for a true side-by-side.
      </p>

      <div className="grid" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Competitor 1  (@handle or URL)" value={c1} onChange={(e) => setC1(e.target.value)} />
        <input className="field" placeholder="Competitor 2  (optional)" value={c2} onChange={(e) => setC2(e.target.value)} />
        <input className="field" placeholder="Competitor 3  (optional)" value={c3} onChange={(e) => setC3(e.target.value)} />
        <input className="field" placeholder="Your channel  (optional — for true gap)" value={mine} onChange={(e) => setMine(e.target.value)} />
        <button className="btn" onClick={run} disabled={loading || !c1.trim()} style={{ width: 160 }}>
          {loading ? "Analyzing…" : "Find gaps"}
        </button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 22 }}>
          <p className="mono muted" style={{ fontSize: 12 }}>
            analysed → {res.rivals.map((r) => r.name).join(" · ")}
          </p>

          <h3 style={{ marginTop: 14, marginBottom: 8 }}>What they're winning with</h3>
          <div className="grid">
            {res.winningThemes.map((t, i) => (
              <div key={i} className="card">
                <b>{t.theme}</b>
                <p style={{ fontSize: 14, margin: "6px 0 4px" }}>{t.why}</p>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t.evidence}</p>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Gaps you can take</h3>
          <div className="grid">
            {res.gaps.map((g, i) => (
              <div key={i} className="card row" style={{ justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{g.idea}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{g.reason}</div>
                </div>
                <button className="btn ghost" onClick={() => save(g)} style={{ padding: "8px 12px", flexShrink: 0 }}>Save</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

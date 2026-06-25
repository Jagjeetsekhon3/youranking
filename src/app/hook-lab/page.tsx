"use client";
import { useState } from "react";

type Rewrite = { hook: string; why: string };
type Result = {
  hookScore: number; whatHappens: string; problems: string[];
  rewrites: Rewrite[]; retentionTips: string[];
  video: { id: string; title: string; thumb: string };
};
function band(s: number) { return s >= 75 ? "good" : s >= 55 ? "mid" : "bad"; }

export default function HookLab() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("shorts");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function analyze() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/hook", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, format }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="eyebrow">Shorts tools · Gemini watches, Claude rewrites</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Hook Lab</h1>
      <p className="lede">
        Gemini watches your opening and reads what actually happens; Claude writes stronger
        hooks from that. The first 1–2 seconds decide everything on Shorts.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10, flexWrap: "wrap" }}>
        <input className="field" placeholder="https://youtube.com/shorts/…" value={url}
          onChange={(e) => setUrl(e.target.value)} style={{ minWidth: 240, flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && url && analyze()} />
        <select className="field" style={{ width: 140 }} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="shorts">Short (1–2s)</option>
          <option value="long">Long-form (15s)</option>
        </select>
        <button className="btn" onClick={analyze} disabled={loading || !url.trim()}>
          {loading ? "Watching…" : "Analyze"}
        </button>
      </div>
      {loading && <p className="mono muted" style={{ fontSize: 12, marginTop: 10 }}>watching the opening — ~20–40s…</p>}
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 22 }}>
          <div className="card row" style={{ justifyContent: "space-between", borderColor: "var(--signal)" }}>
            <div className="row" style={{ gap: 14 }}>
              {res.video.thumb && <img src={res.video.thumb} alt="" style={{ width: 110, borderRadius: 8 }} />}
              <div>
                <div style={{ fontWeight: 600 }}>{res.video.title}</div>
                <p className="muted" style={{ fontSize: 13, margin: "6px 0 0", maxWidth: "48ch" }}>{res.whatHappens}</p>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className={`score ${band(res.hookScore)}`} style={{ fontSize: 22, padding: "8px 14px" }}>{res.hookScore}</div>
              <div className="mono muted" style={{ fontSize: 10, marginTop: 4 }}>HOOK</div>
            </div>
          </div>

          {res.problems.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="eyebrow">What's killing retention</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {res.problems.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
              </ul>
            </div>
          )}

          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Stronger hooks</h3>
          <div className="grid">
            {res.rewrites.map((r, i) => (
              <div key={i} className="card">
                <div style={{ fontWeight: 600 }}>{r.hook}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{r.why}</div>
              </div>
            ))}
          </div>

          {res.retentionTips.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="eyebrow">Quick retention wins</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {res.retentionTips.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

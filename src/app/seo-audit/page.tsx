"use client";
import { useState } from "react";

type Area = { area: string; score: number; finding: string; fix: string };
type Result = {
  score: number; breakdown: Area[]; hook: string; summary: string;
  videoAnalyzed: boolean;
  video: { id: string; title: string; channelTitle: string; views: number; thumb: string };
};

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function band(s: number) {
  return s >= 75 ? "good" : s >= 55 ? "mid" : "bad";
}

export default function SeoAudit() {
  const [url, setUrl] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function audit() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/seo-audit", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Audit failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="eyebrow">Video optimization · Gemini</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>SEO Audit</h1>
      <p className="lede">
        Paste a video URL. Gemini watches the actual video and audits title, hook,
        thumbnail-promise, description and chapters — then names the biggest win.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="https://youtube.com/watch?v=…"
          value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && url && audit()} />
        <button className="btn" onClick={audit} disabled={loading || !url.trim()}>
          {loading ? "Auditing…" : "Audit"}
        </button>
      </div>
      {loading && <p className="mono muted" style={{ fontSize: 12, marginTop: 10 }}>watching the video — this can take 20–40s…</p>}
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 22 }}>
          <div className="card row" style={{ justifyContent: "space-between", borderColor: "var(--signal)" }}>
            <div className="row" style={{ gap: 14 }}>
              {res.video.thumb && <img src={res.video.thumb} alt="" style={{ width: 120, borderRadius: 8 }} />}
              <div>
                <div style={{ fontWeight: 600 }}>{res.video.title}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {res.video.channelTitle} · <span className="mono">{fmt(res.video.views)} views</span>
                </div>
                <div className="mono muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {res.videoAnalyzed ? "✓ video watched" : "metadata only — video not ingested"}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className={`score ${band(res.score)}`} style={{ fontSize: 22, padding: "8px 14px" }}>{res.score}</div>
              <div className="mono muted" style={{ fontSize: 10, marginTop: 4 }}>OVERALL</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="eyebrow">Biggest win</div>
            <p style={{ margin: "8px 0 0" }}>{res.summary}</p>
            {res.hook && res.hook !== "not analysed" && (
              <p className="muted" style={{ fontSize: 14, marginTop: 8 }}><b>Hook:</b> {res.hook}</p>
            )}
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {res.breakdown.map((a, i) => (
              <div key={i} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{a.area}</b>
                  <span className={`score ${band(a.score)}`}>{a.score}</span>
                </div>
                <p style={{ fontSize: 14, margin: "8px 0 4px" }}>{a.finding}</p>
                <p className="muted" style={{ fontSize: 14, margin: 0 }}><b style={{ color: "var(--signal)" }}>Fix:</b> {a.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

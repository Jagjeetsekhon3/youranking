"use client";
import { useState } from "react";

type Outlier = {
  id: string; title: string; channelTitle: string; publishedAt: string;
  views: number; thumb: string; subs: number; multiplier: number; scorable: boolean;
};

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function band(m: number) {
  return m >= 10 ? "good" : m >= 3 ? "mid" : "bad";
}

export default function OutlierFinder() {
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(90);
  const [rows, setRows] = useState<Outlier[]>([]);
  const [quota, setQuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function scan() {
    setLoading(true); setErr(""); setRows([]); setQuota(null);
    try {
      const res = await fetch("/api/outliers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, days, order: "relevance" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");
      setRows(data.outliers || []);
      setQuota(data.quotaUsed ?? null);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function save(o: Outlier) {
    await fetch("/api/ideas", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: o.title,
        note: `${o.multiplier}x outlier · ${fmt(o.views)} views · ${o.channelTitle}`,
        source_url: `https://youtube.com/watch?v=${o.id}`,
      }),
    });
    alert("Saved to Idea Bank");
  }

  return (
    <div>
      <div className="eyebrow">Idea discovery · the core</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Outlier Finder</h1>
      <p className="lede">
        Scan a niche for videos punching above their channel&rsquo;s weight.
        Score = views &divide; subscribers. 3x+ is a real outlier; 10x+ broke out.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="e.g. BGMI sensitivity settings"
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query && scan()} />
        <select className="field" style={{ width: 150 }} value={days}
          onChange={(e) => setDays(Number(e.target.value))}>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
          <option value={3650}>All time</option>
        </select>
        <button className="btn" onClick={scan} disabled={loading || !query.trim()}>
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>

      {quota !== null && (
        <p className="mono muted" style={{ fontSize: 12, marginTop: 10 }}>
          quota spent this scan: {quota} units · ~{Math.floor(10000 / quota)} scans/day on free tier
        </p>
      )}
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      <div className="grid" style={{ marginTop: 18 }}>
        {rows.map((o) => (
          <div key={o.id} className="card row" style={{ justifyContent: "space-between", gap: 14 }}>
            <div className="row" style={{ gap: 14 }}>
              {o.thumb && <img src={o.thumb} alt="" style={{ width: 120, borderRadius: 8, flexShrink: 0 }} />}
              <div>
                <a href={`https://youtube.com/watch?v=${o.id}`} target="_blank" rel="noreferrer"
                  style={{ fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  {o.title}
                </a>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {o.channelTitle} · <span className="mono">{fmt(o.views)} views</span>
                  {o.scorable && <> · <span className="mono">{fmt(o.subs)} subs</span></>}
                </div>
              </div>
            </div>
            <div className="row" style={{ flexShrink: 0 }}>
              {o.scorable
                ? <span className={`score ${band(o.multiplier)}`}>{o.multiplier}x</span>
                : <span className="score" style={{ color: "var(--muted)" }}>hidden subs</span>}
              <button className="btn ghost" onClick={() => save(o)} style={{ padding: "8px 12px" }}>Save</button>
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && quota !== null && (
          <p className="muted">No scorable outliers in that window. Try a broader query or longer window.</p>
        )}
      </div>
    </div>
  );
}

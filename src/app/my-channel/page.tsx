"use client";
import { useEffect, useState } from "react";

type Overview = {
  connected: boolean;
  channel?: { title: string; subs: number; views: number };
  bestDay?: string;
  revenue?: { estimatedRevenue: number; playbackCpm: number; monetizedPlaybacks: number } | null;
  recent?: { id: string; title: string; thumb: string }[];
};

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function MyChannel() {
  const [data, setData] = useState<Overview | null>(null);
  const [curve, setCurve] = useState<{ at: number; watchRatio: number }[] | null>(null);
  const [activeVideo, setActiveVideo] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/analytics");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d);
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function retention(video: string, title: string) {
    setActiveVideo(title); setCurve(null);
    try {
      const r = await fetch("/api/analytics", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ video }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCurve(d.curve || []);
    } catch (e: any) { setErr(e.message); }
  }

  if (!data) return <div><h1 style={{ fontSize: 30 }}>My Channel</h1><p className="muted">{err || "Loading…"}</p></div>;

  if (!data.connected) {
    return (
      <div>
        <div className="eyebrow">Your channel · YouTube Analytics</div>
        <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>My Channel</h1>
        <p className="lede">
          Connect your YouTube channel to see real retention curves, your true RPM, and your
          best day to publish — the data only an authenticated connection can show.
        </p>
        <a href="/api/oauth/start" className="btn" style={{ display: "inline-block", marginTop: 18, textDecoration: "none" }}>
          Connect YouTube channel
        </a>
        {err && <p className="err" style={{ marginTop: 14 }}>{err}</p>}
        <p className="muted" style={{ fontSize: 13, marginTop: 18, maxWidth: "60ch" }}>
          Read-only access to your analytics. Requires a Google OAuth app configured in your
          environment (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
        </p>
      </div>
    );
  }

  const maxR = curve && curve.length ? Math.max(...curve.map((c) => c.watchRatio), 0.01) : 1;

  return (
    <div>
      <div className="eyebrow">Your channel · YouTube Analytics</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>{data.channel?.title || "My Channel"}</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 18 }}>
        <div className="card"><div className="mono" style={{ fontSize: 22 }}>{fmt(data.channel?.subs || 0)}</div><div className="mono muted" style={{ fontSize: 10 }}>SUBSCRIBERS</div></div>
        <div className="card"><div className="mono" style={{ fontSize: 22 }}>{fmt(data.channel?.views || 0)}</div><div className="mono muted" style={{ fontSize: 10 }}>TOTAL VIEWS</div></div>
        <div className="card"><div className="mono" style={{ fontSize: 22, color: "var(--signal)" }}>{data.bestDay}</div><div className="mono muted" style={{ fontSize: 10 }}>BEST DAY (90d)</div></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">Earnings (last 28 days)</div>
        {data.revenue ? (
          <p className="mono" style={{ marginTop: 10 }}>
            ${data.revenue.estimatedRevenue?.toFixed(2)} est · RPM-ish ${data.revenue.playbackCpm?.toFixed(2)} CPM · {fmt(data.revenue.monetizedPlaybacks || 0)} monetized plays
          </p>
        ) : (
          <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>No revenue data — channel may not be monetized, or the monetary scope wasn't granted.</p>
        )}
      </div>

      <h3 style={{ marginTop: 20, marginBottom: 8 }}>Recent videos — tap for retention curve</h3>
      <div className="grid">
        {data.recent?.map((v) => (
          <div key={v.id} className="card row" style={{ justifyContent: "space-between", gap: 14, cursor: "pointer" }}
            onClick={() => retention(v.id, v.title)}>
            <div className="row" style={{ gap: 12 }}>
              {v.thumb && <img src={v.thumb} alt="" style={{ width: 90, borderRadius: 6 }} />}
              <div style={{ fontWeight: 600 }}>{v.title}</div>
            </div>
            <span className="mono muted" style={{ fontSize: 12, flexShrink: 0 }}>view curve →</span>
          </div>
        ))}
      </div>

      {activeVideo && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="eyebrow">Retention · {activeVideo}</div>
          {!curve ? <p className="muted" style={{ marginTop: 8 }}>Loading curve…</p> : curve.length === 0 ? (
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Not enough data for this video yet.</p>
          ) : (
            <>
              <div className="row" style={{ alignItems: "flex-end", gap: 1, height: 120, marginTop: 14 }}>
                {curve.map((c, i) => (
                  <div key={i} title={`${Math.round(c.at * 100)}%: ${c.watchRatio.toFixed(2)}`}
                    style={{ flex: 1, background: "var(--good)", height: `${(c.watchRatio / maxR) * 100}%`, minHeight: 1, opacity: 0.85 }} />
                ))}
              </div>
              <p className="mono muted" style={{ fontSize: 11, marginTop: 8 }}>left = start of video → right = end · taller = more viewers still watching</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

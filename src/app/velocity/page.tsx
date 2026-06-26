"use client";
import { useEffect, useState } from "react";

type Row = { id: string; title: string; channel: string; thumb: string; latest: number; velocity: number; points: number };
function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function Velocity() {
  const [rows, setRows] = useState<Row[]>([]);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/velocity");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setRows(data.tracked || []);
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!url.trim()) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/velocity", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setUrl(""); load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function untrack(id: string) {
    await fetch(`/api/velocity?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="eyebrow">Momentum tracking</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>View Velocity</h1>
      <p className="lede">
        Track videos and watch their views/day. A daily snapshot builds the curve — so you
        catch what's <i>breaking out right now</i>, not just what's already big.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Paste a video URL to track" value={url}
          onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add} disabled={busy}>{busy ? "Adding…" : "Track"}</button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>Connect Supabase to use velocity tracking — {err}</p>}

      <div className="grid" style={{ marginTop: 20 }}>
        {rows.map((v) => (
          <div key={v.id} className="card row" style={{ justifyContent: "space-between", gap: 14 }}>
            <div className="row" style={{ gap: 14 }}>
              {v.thumb && <img src={v.thumb} alt="" style={{ width: 100, borderRadius: 8 }} />}
              <div>
                <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
                  style={{ fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>{v.title}</a>
                <div className="muted mono" style={{ fontSize: 12, marginTop: 4 }}>
                  {fmt(v.latest)} views {v.points < 2 ? "· need 1+ more day for velocity" : ""}
                </div>
              </div>
            </div>
            <div className="row" style={{ flexShrink: 0 }}>
              <span className="score good" title="views per day">{v.velocity > 0 ? "+" + fmt(v.velocity) + "/d" : "—"}</span>
              <button className="btn ghost" onClick={() => untrack(v.id)} style={{ padding: "8px 12px" }}>Stop</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && !err && <p className="muted">No tracked videos yet. Paste a competitor or your own upload above.</p>}
      </div>
    </div>
  );
}

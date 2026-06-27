"use client";
import { useEffect, useState } from "react";

type Idea = { title: string; angle: string; why: string };
type Saved = { title: string; note?: string };
type Chan = { connected: boolean; channel?: { title: string; subs: number; views: number }; bestDay?: string };

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const TOOLS = [
  { href: "/outlier-finder", label: "Outlier Finder" },
  { href: "/niche-finder", label: "Niche Finder" },
  { href: "/hook-lab", label: "Hook Lab" },
  { href: "/seo-audit", label: "SEO Audit" },
  { href: "/title-lab", label: "Title Lab" },
  { href: "/competitor-gap", label: "Competitor Gap" },
];

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [recent, setRecent] = useState<Saved[]>([]);
  const [niche, setNiche] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [chan, setChan] = useState<Chan | null>(null);

  async function loadDash(opts: { force?: boolean; niche?: string } = {}) {
    setRefreshing(true);
    const q = new URLSearchParams();
    if (opts.force) q.set("force", "1");
    if (opts.niche !== undefined) q.set("niche", opts.niche);
    try {
      const r = await fetch(`/api/dashboard?${q}`);
      const d = await r.json();
      setIdeas(d.ideas || []);
      setRecent(d.recent || []);
      if (d.niche && opts.niche === undefined) setNiche(d.niche);
    } catch { setIdeas([]); }
    setRefreshing(false);
  }

  useEffect(() => {
    loadDash();
    fetch("/api/analytics").then((r) => r.json()).then(setChan).catch(() => {});
  }, []);

  async function save(i: Idea) {
    await fetch("/api/ideas", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: i.title, note: `${i.angle} — ${i.why}` }),
    });
    loadDash();
  }

  return (
    <div>
      <div className="eyebrow">Your studio</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>{greeting()}, Jagjeet</h1>
      <p className="lede">Here's what's worth making today.</p>

      {/* Today's ideas */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>Today's ideas</h3>
          <div className="row" style={{ gap: 8 }}>
            <input className="field" placeholder="Set your focus…" value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDash({ niche })}
              style={{ width: 200, padding: "8px 12px" }} />
            <button className="btn ghost" onClick={() => loadDash({ force: true })} disabled={refreshing}
              style={{ padding: "8px 14px" }}>{refreshing ? "…" : "Refresh"}</button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
          {ideas === null && <p className="muted">Thinking up ideas…</p>}
          {ideas?.map((i, k) => (
            <div key={k} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 600 }}>{i.title}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{i.angle}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{i.why}</div>
              <button className="btn ghost" onClick={() => save(i)} style={{ padding: "5px 12px", marginTop: 10, fontSize: 13 }}>Save to Idea Bank</button>
            </div>
          ))}
          {ideas?.length === 0 && <p className="muted">Couldn't load ideas — check your Claude key in Settings.</p>}
        </div>
      </div>

      {/* Channel + recent, side by side */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
        {/* Channel snapshot */}
        <div className="card">
          <h3 style={{ margin: 0, fontSize: 17 }}>Your channel</h3>
          {chan?.connected ? (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14 }}>
              <div><div className="mono" style={{ fontSize: 20 }}>{fmt(chan.channel?.subs || 0)}</div><div className="mono muted" style={{ fontSize: 10 }}>SUBS</div></div>
              <div><div className="mono" style={{ fontSize: 20 }}>{fmt(chan.channel?.views || 0)}</div><div className="mono muted" style={{ fontSize: 10 }}>VIEWS</div></div>
              <div><div className="mono" style={{ fontSize: 20, color: "var(--signal)" }}>{chan.bestDay || "—"}</div><div className="mono muted" style={{ fontSize: 10 }}>BEST DAY</div></div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <p className="muted" style={{ fontSize: 14 }}>Connect your channel to see real subs, views, and your best day to publish.</p>
              <a href="/my-channel" className="btn" style={{ display: "inline-block", marginTop: 10, textDecoration: "none", padding: "8px 14px", fontSize: 14 }}>Connect channel</a>
            </div>
          )}
        </div>

        {/* Recent from idea bank */}
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>From your Idea Bank</h3>
            <a href="/idea-bank" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>View all →</a>
          </div>
          <div style={{ marginTop: 12 }}>
            {recent.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Nothing saved yet — save an idea above to start your swipe file.</p>}
            {recent.slice(0, 5).map((r, k) => (
              <div key={k} style={{ padding: "8px 0", borderTop: k ? "1px solid var(--border)" : "none", fontSize: 14 }}>{r.title}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick launch */}
      <h3 style={{ fontSize: 15, margin: "24px 0 10px" }} className="muted">Jump into a tool</h3>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {TOOLS.map((t) => (
          <a key={t.href} href={t.href} className="card" style={{ textDecoration: "none", color: "inherit", padding: 14, fontWeight: 600 }}>
            {t.label} <span className="muted" style={{ fontWeight: 400 }}>→</span>
          </a>
        ))}
      </div>
    </div>
  );
}

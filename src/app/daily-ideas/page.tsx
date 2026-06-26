"use client";
import { useState } from "react";

type Idea = { title: string; angle: string; why: string };

export default function DailyIdeas() {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function gen() {
    setLoading(true); setErr(""); setIdeas([]);
    try {
      const r = await fetch("/api/daily-ideas", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setIdeas(data.ideas || []);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function save(i: Idea) {
    await fetch("/api/ideas", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: i.title, note: `${i.angle} — ${i.why}` }),
    });
    alert("Saved to Idea Bank");
  }

  return (
    <div>
      <div className="eyebrow">Your daily feed · Claude</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Daily Ideas</h1>
      <p className="lede">
        Fresh video ideas every day, built from your saved Idea Bank so they don't repeat.
        Set your focus and generate today's batch.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Your focus, e.g. BGMI tips / AI travel shorts" value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && gen()} />
        <button className="btn" onClick={gen} disabled={loading}>
          {loading ? "Thinking…" : "Generate today's ideas"}
        </button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      <div className="grid" style={{ marginTop: 20 }}>
        {ideas.map((i, k) => (
          <div key={k} className="card row" style={{ justifyContent: "space-between", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{i.title}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{i.angle}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{i.why}</div>
            </div>
            <button className="btn ghost" onClick={() => save(i)} style={{ padding: "8px 12px", flexShrink: 0 }}>Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}

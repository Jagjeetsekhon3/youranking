"use client";
import { useEffect, useState } from "react";

type Idea = { id: string; title: string; note?: string; source_url?: string };

export default function IdeaBank() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(data.ideas || []);
    } catch (e: any) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!title.trim()) return;
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="eyebrow">Swipe file</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Idea Bank</h1>
      <p className="lede">
        Every saved title and outlier lands here. Over months this becomes your
        personal content engine. (Capture from the extension later — same database.)
      </p>

      <div className="row" style={{ marginTop: 22 }}>
        <input className="field" placeholder="Quick idea…" value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Save</button>
      </div>

      {err && <p className="err" style={{ marginTop: 16 }}>Connect Supabase to use the Idea Bank — {err}</p>}

      <div className="grid" style={{ marginTop: 20 }}>
        {ideas.map((i) => (
          <div key={i.id} className="card row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{i.title}</div>
              {i.note && <div className="muted" style={{ fontSize: 13 }}>{i.note}</div>}
            </div>
            <button className="btn ghost" onClick={() => remove(i.id)} style={{ padding: "8px 12px" }}>
              Remove
            </button>
          </div>
        ))}
        {!err && ideas.length === 0 && (
          <p className="muted">No ideas yet. Save one above, or send winners over from Title Lab.</p>
        )}
      </div>
    </div>
  );
}

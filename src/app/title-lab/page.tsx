"use client";
import { useState } from "react";

type T = { title: string; score: number; reason: string; length: number };

function band(s: number) {
  return s >= 75 ? "good" : s >= 55 ? "mid" : "bad";
}

export default function TitleLab() {
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    setTitles([]);
    try {
      const res = await fetch("/api/titles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setTitles((data.titles || []).sort((a: T, b: T) => b.score - a.score));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(t: T) {
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: t.title, note: `score ${t.score} — ${t.reason}` }),
    });
    alert("Saved to Idea Bank");
  }

  return (
    <div>
      <div className="eyebrow">Packaging lab &middot; Claude</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Title Lab</h1>
      <p className="lede">
        Give it a topic. Get 10 titles, scored and ranked. Save the winners to your Idea Bank.
      </p>

      <div className="row" style={{ marginTop: 22 }}>
        <input
          className="field"
          placeholder="e.g. BGMI sensitivity settings for headshots"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && topic && generate()}
        />
        <button className="btn" onClick={generate} disabled={loading || !topic.trim()}>
          {loading ? "Writing…" : "Generate"}
        </button>
      </div>

      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      <div className="grid" style={{ marginTop: 20 }}>
        {titles.map((t, i) => (
          <div key={i} className="card row" style={{ justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{t.title}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {t.reason} <span className="mono">· {t.length} chars</span>
              </div>
            </div>
            <div className="row" style={{ flexShrink: 0 }}>
              <span className={`score ${band(t.score)}`}>{t.score}</span>
              <button className="btn ghost" onClick={() => save(t)} style={{ padding: "8px 12px" }}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";

type Result = { description: string; tags: string[]; hashtags: string[] };

export default function Metadata() {
  const [topic, setTopic] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  async function gen() {
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/metadata", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(topic.startsWith("http") ? { url: topic } : { topic }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed.");
      setRes(data);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text); setCopied(what);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div>
      <div className="eyebrow">Packaging · Gemini</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Tags &amp; Description</h1>
      <p className="lede">
        A keyword-placed description (main keyword in the first line), 8–12 tags, and
        hashtags — from a topic or an existing video URL. Copy straight into Studio.
      </p>

      <div className="row" style={{ marginTop: 22, gap: 10 }}>
        <input className="field" placeholder="Topic, or paste a video URL" value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && topic && gen()} />
        <button className="btn" onClick={gen} disabled={loading || !topic.trim()}>
          {loading ? "Writing…" : "Generate"}
        </button>
      </div>
      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {res && (
        <div style={{ marginTop: 20 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">Description</div>
              <button className="btn ghost" onClick={() => copy(res.description, "desc")} style={{ padding: "6px 12px" }}>
                {copied === "desc" ? "Copied" : "Copy"}
              </button>
            </div>
            <p style={{ whiteSpace: "pre-wrap", marginTop: 10, fontSize: 14 }}>{res.description}</p>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">Tags</div>
              <button className="btn ghost" onClick={() => copy(res.tags.join(", "), "tags")} style={{ padding: "6px 12px" }}>
                {copied === "tags" ? "Copied" : "Copy all"}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>{res.tags.join(" · ")}</p>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="eyebrow">Hashtags</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "var(--signal)" }}>{res.hashtags.map(h => h.startsWith("#") ? h : "#" + h).join(" ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

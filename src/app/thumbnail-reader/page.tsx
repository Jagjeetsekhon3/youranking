"use client";
import { useState } from "react";

type Read = {
  label: string;
  clickAppeal: number;
  clarity: number;
  legibility: number;
  focalPoint: string;
  standout: string;
  overall: number;
};
type Result = { thumbnails: Read[]; winner: string; verdict: string; fixes: string[] };

function band(s: number) {
  return s >= 75 ? "good" : s >= 55 ? "mid" : "bad";
}

export default function ThumbnailReader() {
  const [previews, setPreviews] = useState<string[]>([]);
  const [payload, setPayload] = useState<{ mediaType: string; data: string }[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setResult(null);
    const pv: string[] = [];
    const pl: { mediaType: string; data: string }[] = [];
    for (const f of files) {
      const dataUrl: string = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(f);
      });
      pv.push(dataUrl);
      pl.push({ mediaType: f.type, data: dataUrl.split(",")[1] });
    }
    setPreviews(pv);
    setPayload(pl);
  }

  async function analyze() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/thumbnails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ images: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const labels = ["A", "B", "C"];

  return (
    <div>
      <div className="eyebrow">Quick gut-check &middot; Gemini</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Thumbnail A/B Reader</h1>
      <p className="lede">
        Drop 2–3 thumbnails. Get a side-by-side read and a winner. Nothing is stored —
        images are analysed once and discarded.
      </p>

      <div className="row" style={{ marginTop: 22 }}>
        <input type="file" accept="image/*" multiple onChange={onFiles} className="field" />
        <button className="btn" onClick={analyze} disabled={loading || payload.length < 2}>
          {loading ? "Reading…" : "Compare"}
        </button>
      </div>

      {previews.length > 0 && (
        <div className="row" style={{ marginTop: 16, gap: 12 }}>
          {previews.map((p, i) => (
            <div key={i} style={{ flex: 1 }}>
              <img src={p} alt={`thumb ${labels[i]}`} style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
              <div className="mono muted" style={{ textAlign: "center", marginTop: 4 }}>{labels[i]}</div>
            </div>
          ))}
        </div>
      )}

      {err && <p className="err" style={{ marginTop: 16 }}>{err}</p>}

      {result && (
        <div style={{ marginTop: 22 }}>
          <div className="card" style={{ borderColor: "var(--signal)" }}>
            <div className="eyebrow">Winner &middot; {result.winner}</div>
            <p style={{ margin: "8px 0 0" }}>{result.verdict}</p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: `repeat(${result.thumbnails.length},1fr)`, marginTop: 12 }}>
            {result.thumbnails.map((t) => (
              <div key={t.label} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0 }}>{t.label}</h3>
                  <span className={`score ${band(t.overall)}`}>{t.overall}</span>
                </div>
                <div className="mono" style={{ fontSize: 12, marginTop: 10, color: "var(--muted)" }}>
                  <div>appeal &nbsp;{t.clickAppeal}</div>
                  <div>clarity {t.clarity}</div>
                  <div>legible {t.legibility}</div>
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>{t.focalPoint}</p>
              </div>
            ))}
          </div>

          {result.fixes?.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="eyebrow">Fixes</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {result.fixes.map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

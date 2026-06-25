export default function Home() {
  return (
    <div>
      <div className="eyebrow">Control room</div>
      <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>
        Find winning ideas. Package them to win.
      </h1>
      <p className="lede">
        Nine tools across the whole workflow — find what's working, decide where to play,
        package it, test it, and fix it. Claude writes; Gemini watches; one router decides who.
      </p>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 28 }}>
        <a href="/title-lab" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Title Lab</h3>
            <span className="score good">CLAUDE</span>
          </div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            10 scored title variants for any topic. Curiosity, specificity, click pull.
          </p>
        </a>

        <a href="/thumbnail-reader" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Thumbnail A/B</h3>
            <span className="score good">GEMINI</span>
          </div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Drop 2–3 thumbnails, get a side-by-side read and a winner. Nothing saved.
          </p>
        </a>
      </div>

      <p className="muted mono" style={{ marginTop: 28, fontSize: 12 }}>
        next up &rarr; outlier finder &middot; niche finder &middot; seo audit &middot; chrome extension
      </p>
    </div>
  );
}

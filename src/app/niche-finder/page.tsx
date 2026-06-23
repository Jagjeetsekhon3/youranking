export default function NicheFinder() {
  return (
    <div>
      <div className="eyebrow">Opportunity scoring</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Niche Finder</h1>
      <p className="lede">Scores demand vs competition, saturation, monetization/RPM potential and momentum. Filter by language, region, format.</p>
      <div className="card stub-note" style={{ marginTop: 22 }}>
        <p><b>To build:</b> combine YouTube view/outlier data (the size signal) with Google Trends on the <i>YouTube property</i> (the direction signal). Never trust Trends alone &mdash; it&rsquo;s relative interest, not volume.</p>
        <p className="mono" style={{ fontSize: 12 }}>trends &rarr; SerpApi (youtube property) &middot; scoring &rarr; run(&quot;niche.score&quot;) = Gemini + grounding</p>
      </div>
    </div>
  );
}

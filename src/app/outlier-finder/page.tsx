export default function OutlierFinder() {
  return (
    <div>
      <div className="eyebrow">Idea discovery &middot; the core</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>Outlier Finder</h1>
      <p className="lede">Videos massively overperforming their channel&rsquo;s sub count, by niche. The headline feature.</p>
      <div className="card stub-note" style={{ marginTop: 22 }}>
        <p><b>To build:</b> scan a niche&rsquo;s channels, compute each video&rsquo;s views &divide; channel baseline, surface the outliers. Badge version goes in the Chrome extension; full scan lives here.</p>
        <p className="mono" style={{ fontSize: 12 }}>data &rarr; YouTube Data API (safe) or scrape (fragile) &middot; analysis &rarr; run(&quot;niche.score&quot;) = Gemini</p>
      </div>
    </div>
  );
}

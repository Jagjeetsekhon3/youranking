export default function SeoAudit() {
  return (
    <div>
      <div className="eyebrow">Video optimization &middot; Gemini</div>
      <h1 style={{ fontSize: 30, margin: "8px 0 0" }}>SEO Audit</h1>
      <p className="lede">Paste a video URL, get a 0&ndash;100 score with specific fixes. Gemini reads the actual video &mdash; the thing Claude can&rsquo;t do.</p>
      <div className="card stub-note" style={{ marginTop: 22 }}>
        <p><b>To build:</b> pass the YouTube URL to Gemini for multimodal analysis (title, first 25 words, tags, chapters, hook, retention). Quick badge in the extension; full report here.</p>
        <p className="mono" style={{ fontSize: 12 }}>run(&quot;seo.audit&quot;) = Gemini (video) &middot; verify current URL-ingestion limits in docs</p>
      </div>
    </div>
  );
}

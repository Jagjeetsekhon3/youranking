"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/my-channel", label: "My Channel", tag: "live" },
  { href: "/daily-ideas", label: "Daily Ideas", tag: "live" },
  { href: "/outlier-finder", label: "Outlier Finder", tag: "live" },
  { href: "/velocity", label: "View Velocity", tag: "live" },
  { href: "/competitor-gap", label: "Competitor Gap", tag: "live" },
  { href: "/niche-finder", label: "Niche Finder", tag: "live" },
  { href: "/trend-radar", label: "Trend Radar", tag: "live" },
  { href: "/keywords", label: "Keyword Research", tag: "live" },
  { href: "/title-lab", label: "Title Lab", tag: "live" },
  { href: "/metadata", label: "Tags & Description", tag: "live" },
  { href: "/thumbnail-reader", label: "Thumbnail A/B", tag: "live" },
  { href: "/hook-lab", label: "Hook Lab", tag: "live" },
  { href: "/seo-audit", label: "SEO Audit", tag: "live" },
  { href: "/idea-bank", label: "Idea Bank", tag: "live" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  if (path === "/login") return null;

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <b>You<span className="dot">.</span>Ranking</b>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={path === n.href ? "active" : ""}>
            {n.label}
            {n.tag && (
              <span className="tag" style={{ color: n.tag === "live" ? "var(--good)" : undefined }}>
                {n.tag}
              </span>
            )}
          </Link>
        ))}
        <button onClick={logout} className="nav-logout">Log out</button>
      </nav>
    </aside>
  );
}

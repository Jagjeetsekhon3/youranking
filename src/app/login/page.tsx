"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true); setErr("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error || "Login failed."); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 360 }}>
        <div className="brand" style={{ marginBottom: 18 }}>
          <b style={{ fontFamily: "Space Grotesk", fontSize: 22 }}>
            You<span style={{ color: "var(--signal)" }}>.</span>Ranking
          </b>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
          Private tool. Enter the password to continue.
        </p>
        <input
          className="field" type="password" placeholder="Password" autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && password && submit()}
          style={{ marginTop: 8 }}
        />
        {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}
        <button className="btn" onClick={submit} disabled={loading || !password}
          style={{ width: "100%", marginTop: 14 }}>
          {loading ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

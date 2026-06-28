"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { client } from "@/lib/rpc";

export default function AdminLogin() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await client.api.auth.login.$post({ json: { token } });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("トークンが正しくありません。");
    }
  }

  return (
    <div className="login-wrap">
      <div
        style={{
          position: "absolute",
          top: "var(--space-4)",
          right: "var(--space-4)",
        }}
      >
        <ThemeToggle />
      </div>
      <div className="login-card">
        <h1>管理ログイン</h1>
        <p>管理者トークンを入力してください。</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="token">管理者トークン</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button
            className="btn"
            type="submit"
            disabled={loading || token.length === 0}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "確認中…" : "ログイン"}
          </button>
        </form>
        <p style={{ marginTop: "var(--space-5)" }}>
          <Link href="/" className="muted" style={{ fontSize: "0.82rem" }}>
            ← サイトに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

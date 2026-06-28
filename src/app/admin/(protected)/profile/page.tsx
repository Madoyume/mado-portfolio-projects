"use client";

import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type SocialLink = { label: string; url: string; iconUrl?: string };

type ProfileForm = {
  name: string;
  headline: string;
  bio: string;
  location: string;
  email: string;
  avatarUrl: string;
  heroImageUrl: string;
  socialLinks: SocialLink[];
};

const blank: ProfileForm = {
  name: "",
  headline: "",
  bio: "",
  location: "",
  email: "",
  avatarUrl: "",
  heroImageUrl: "",
  socialLinks: [],
};

export default function ProfileAdminPage() {
  const [form, setForm] = useState<ProfileForm>(blank);
  const [status, setStatus] = useState("");

  async function load() {
    const res = await client.api.profile.$get();
    if (!res.ok) return;
    const p = await res.json();
    setForm({
      name: p.name ?? "",
      headline: p.headline ?? "",
      bio: p.bio ?? "",
      location: p.location ?? "",
      email: p.email ?? "",
      avatarUrl: p.avatarUrl ?? "",
      heroImageUrl: p.heroImageUrl ?? "",
      socialLinks: (p.socialLinks ?? []).map((l) => ({
        label: l.label,
        url: l.url,
        iconUrl: l.iconUrl ?? undefined,
      })),
    });
  }

  useEffect(() => {
    load();
  }, []);

  function setLink(index: number, patch: Partial<SocialLink>) {
    setForm({
      ...form,
      socialLinks: form.socialLinks.map((l, i) =>
        i === index ? { ...l, ...patch } : l,
      ),
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    const res = await client.api.profile.$put({
      json: {
        name: form.name,
        headline: form.headline,
        bio: form.bio || null,
        location: form.location || null,
        email: form.email || null,
        avatarUrl: form.avatarUrl || null,
        heroImageUrl: form.heroImageUrl || null,
        socialLinks: form.socialLinks
          .filter((l) => l.label && l.url)
          .map((l) => ({
            label: l.label,
            url: l.url,
            iconUrl: l.iconUrl || undefined,
          })),
      },
    });
    setStatus(res.ok ? "保存しました。" : "保存に失敗しました。");
    if (res.ok) load();
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="プロフィール" />
      <form className="panel" onSubmit={submit} style={{ maxWidth: 680 }}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="name">表示名</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="headline">肩書き</label>
            <input
              id="headline"
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bio">自己紹介</label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="location">所在地</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="email">連絡先</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="avatarUrl">アバター画像URL</label>
          <input
            id="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
          <p className="field__hint">
            画像アップロード（Cloudinary）は Phase 6
            後半で対応。当面はURL直指定。
          </p>
        </div>
        <div className="field">
          <label htmlFor="heroImageUrl">ヒーロー画像URL</label>
          <input
            id="heroImageUrl"
            type="url"
            value={form.heroImageUrl}
            onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
          />
        </div>

        <h2
          style={{
            fontSize: "1rem",
            margin: "var(--space-5) 0 var(--space-3)",
          }}
        >
          SNS リンク
        </h2>
        {form.socialLinks.map((link, i) => (
          <div className="sns-row" key={i}>
            <div className="field">
              <label>ラベル</label>
              <input
                type="text"
                value={link.label}
                onChange={(e) => setLink(i, { label: e.target.value })}
              />
            </div>
            <div className="field">
              <label>URL</label>
              <input
                type="url"
                value={link.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() =>
                setForm({
                  ...form,
                  socialLinks: form.socialLinks.filter((_, j) => j !== i),
                })
              }
            >
              削除
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() =>
            setForm({
              ...form,
              socialLinks: [...form.socialLinks, { label: "", url: "" }],
            })
          }
        >
          + リンクを追加
        </button>

        <div
          style={{
            marginTop: "var(--space-5)",
            display: "flex",
            gap: "var(--space-3)",
            alignItems: "center",
          }}
        >
          <button type="submit" className="btn">
            保存
          </button>
          {status && <span className="muted">{status}</span>}
        </div>
      </form>
    </main>
  );
}

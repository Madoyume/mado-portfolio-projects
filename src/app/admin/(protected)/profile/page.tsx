"use client";

import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { UploadButton } from "@/components/admin/upload-button";
import {
  AVATAR_PUBLIC_ID,
  HERO_PUBLIC_ID,
  SOCIAL_FOLDER,
} from "@/lib/constants";
import { client } from "@/lib/rpc";
import { uploadToCloudinary } from "@/lib/upload";

type SocialLink = {
  label: string;
  url: string;
  iconId?: string;
  iconIdDark?: string;
  iconPreview?: string;
  iconPreviewDark?: string;
};

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
        iconId: l.iconId ?? undefined,
        iconIdDark: l.iconIdDark ?? undefined,
        iconPreview: l.iconUrl ?? undefined,
        iconPreviewDark: l.iconUrlDark ?? undefined,
      })),
    });
  }

  useEffect(() => {
    load();
  }, []);

  function setLink(index: number, patch: Partial<SocialLink>) {
    setForm((f) => ({
      ...f,
      socialLinks: f.socialLinks.map((l, i) =>
        i === index ? { ...l, ...patch } : l,
      ),
    }));
  }

  async function uploadHero(file: File) {
    const { url } = await uploadToCloudinary(file, {
      publicId: HERO_PUBLIC_ID,
    });
    await client.api.profile["hero-image"].$post();
    setForm((f) => ({ ...f, heroImageUrl: url }));
  }

  async function removeHero() {
    const res = await client.api.profile["hero-image"].$delete();
    if (res.ok) setForm((f) => ({ ...f, heroImageUrl: "" }));
  }

  async function uploadAvatar(file: File) {
    const { url } = await uploadToCloudinary(file, {
      publicId: AVATAR_PUBLIC_ID,
    });
    await client.api.profile.avatar.$post();
    setForm((f) => ({ ...f, avatarUrl: url }));
  }

  async function removeAvatar() {
    const res = await client.api.profile.avatar.$delete();
    if (res.ok) setForm((f) => ({ ...f, avatarUrl: "" }));
  }

  async function uploadIcon(
    index: number,
    file: File,
    key: "iconId" | "iconIdDark",
  ) {
    const { url, publicId } = await uploadToCloudinary(file, {
      folder: SOCIAL_FOLDER,
    });
    const previewKey = key === "iconId" ? "iconPreview" : "iconPreviewDark";
    setLink(index, { [key]: publicId, [previewKey]: url });
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
        socialLinks: form.socialLinks
          .filter((l) => l.label && l.url)
          .map((l) => ({
            label: l.label,
            url: l.url,
            iconId: l.iconId || undefined,
            iconIdDark: l.iconIdDark || undefined,
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
        <div className="field image-field">
          <label>アバター画像</label>
          {form.avatarUrl && (
            <img
              src={form.avatarUrl}
              alt=""
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--border)",
              }}
            />
          )}
          <div className="image-field__actions">
            <UploadButton label="画像をアップロード" onSelect={uploadAvatar} />
            {form.avatarUrl && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={removeAvatar}
              >
                画像を削除
              </button>
            )}
          </div>
        </div>

        <div className="field image-field">
          <label>ヒーロー画像</label>
          {form.heroImageUrl && (
            <img
              src={form.heroImageUrl}
              alt=""
              className="hero-setting__preview"
            />
          )}
          <div className="image-field__actions">
            <UploadButton label="画像をアップロード" onSelect={uploadHero} />
            {form.heroImageUrl && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={removeHero}
              >
                画像を削除
              </button>
            )}
          </div>
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
            <div className="sns-icon">
              {link.iconPreview && <img src={link.iconPreview} alt="" />}
              <UploadButton
                label="通常"
                onSelect={(file) => uploadIcon(i, file, "iconId")}
              />
            </div>
            <div className="sns-icon sns-icon--dark">
              {link.iconPreviewDark && (
                <img src={link.iconPreviewDark} alt="" />
              )}
              <UploadButton
                label="ダーク"
                onSelect={(file) => uploadIcon(i, file, "iconIdDark")}
              />
            </div>
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

"use client";

import type { InferRequestType, InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { UploadButton } from "@/components/admin/upload-button";
import { formatDate } from "@/lib/format";
import { client } from "@/lib/rpc";
import { uploadToCloudinary } from "@/lib/upload";

type Post = InferResponseType<
  typeof client.api.blog.admin.all.$get,
  200
>[number];
type PostJson = InferRequestType<typeof client.api.blog.$post>["json"];

type PostForm = {
  slug: string;
  title: string;
  description: string;
  body: string;
  coverImageUrl: string;
  tags: string;
  status: "draft" | "published";
  publishedAt: string;
};

const blank: PostForm = {
  slug: "",
  title: "",
  description: "",
  body: "",
  coverImageUrl: "",
  tags: "",
  status: "draft",
  publishedAt: "",
};

export default function BlogAdminPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [form, setForm] = useState<PostForm>(blank);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await client.api.blog.admin.all.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(blank);
    setEditingSlug(null);
    setError("");
  }

  function edit(post: Post) {
    setEditingSlug(post.slug);
    setError("");
    setForm({
      slug: post.slug,
      title: post.title,
      description: post.description ?? "",
      body: post.body,
      coverImageUrl: post.coverImageUrl ?? "",
      tags: (post.tags ?? []).join(", "),
      status: post.status,
      publishedAt: post.publishedAt ?? "",
    });
  }

  async function uploadCover(file: File) {
    const { url } = await uploadToCloudinary(file, { folder: "mado/blog" });
    setForm((f) => ({ ...f, coverImageUrl: url }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const publishedAt =
      form.status === "published" && !form.publishedAt
        ? new Date().toISOString()
        : form.publishedAt || null;
    const json: PostJson = {
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      body: form.body,
      coverImageUrl: form.coverImageUrl || null,
      status: form.status,
      publishedAt,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const res = editingSlug
      ? await client.api.blog[":slug"].$put({
          param: { slug: editingSlug },
          json,
        })
      : await client.api.blog.$post({ json });
    if (res.ok) {
      reset();
      await load();
    } else if (res.status === 409) {
      setError("その slug は既に使われています。");
    } else {
      setError("保存に失敗しました。入力を確認してください。");
    }
  }

  async function remove(slug: string) {
    if (!window.confirm("この記事を削除しますか？")) return;
    const res = await client.api.blog[":slug"].$delete({ param: { slug } });
    if (res.ok) {
      if (editingSlug === slug) reset();
      await load();
    }
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="ブログ" />

      <table className="table" style={{ marginBottom: "var(--space-6)" }}>
        <thead>
          <tr>
            <th>タイトル</th>
            <th>状態</th>
            <th>公開日</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>
                <span
                  className={`badge badge--${post.status === "published" ? "published" : "draft"}`}
                >
                  {post.status}
                </span>
              </td>
              <td>{formatDate(post.publishedAt)}</td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => edit(post)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(post.slug)}
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="panel" onSubmit={submit}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "var(--space-4)" }}>
          {editingSlug ? "記事を編集" : "記事を作成"}
        </h2>
        <div className="field-row">
          <div className="field">
            <label htmlFor="title">タイトル</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="slug">slug</label>
            <input
              id="slug"
              type="text"
              pattern="[a-z0-9-]+"
              placeholder="my-post"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">概要</label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="body">本文 (Markdown)</label>
          <textarea
            id="body"
            style={{ minHeight: 320 }}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tags">タグ (カンマ区切り)</label>
          <input
            id="tags"
            type="text"
            placeholder="Next.js, Hono"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>
        <div className="field image-field">
          <label htmlFor="coverImageUrl">カバー画像</label>
          {form.coverImageUrl && (
            <img
              src={form.coverImageUrl}
              alt=""
              className="hero-setting__preview"
            />
          )}
          <input
            id="coverImageUrl"
            type="url"
            placeholder="URL直接入力、または下からアップロード"
            value={form.coverImageUrl}
            onChange={(e) =>
              setForm({ ...form, coverImageUrl: e.target.value })
            }
          />
          <div className="image-field__actions">
            <UploadButton label="画像をアップロード" onSelect={uploadCover} />
            {form.coverImageUrl && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => setForm({ ...form, coverImageUrl: "" })}
              >
                クリア
              </button>
            )}
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="status">状態</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "draft" | "published",
                })
              }
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="publishedAt">公開日時 (ISO8601)</label>
            <input
              id="publishedAt"
              type="text"
              placeholder="2026-06-20T09:00:00.000Z"
              value={form.publishedAt}
              onChange={(e) =>
                setForm({ ...form, publishedAt: e.target.value })
              }
            />
            <p className="field__hint">
              空のまま published にすると現在時刻が入ります。
            </p>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button type="submit" className="btn">
            {editingSlug ? "更新" : "作成"}
          </button>
          {editingSlug && (
            <button type="button" className="btn btn--ghost" onClick={reset}>
              キャンセル
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

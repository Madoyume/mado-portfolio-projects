"use client";

import type { InferRequestType, InferResponseType } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/admin/modal";
import { TagInput } from "@/components/admin/tag-input";
import { AdminTopbar } from "@/components/admin/topbar";
import { useUnsavedGuard } from "@/components/admin/unsaved-guard";
import { UploadButton } from "@/components/admin/upload-button";
import { MarkdownContent } from "@/components/markdown";
import {
  BLOG_FOLDER,
  POST_STATUS,
  type PostStatus,
  SLUG_PATTERN,
  SLUG_REGEX,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { client } from "@/lib/rpc";
import { uploadToCloudinary } from "@/lib/upload";

type Post = InferResponseType<
  typeof client.api.blog.admin.all.$get,
  200
>[number];
type PostJson = InferRequestType<typeof client.api.blog.$post>["json"];
type BlogImage = InferResponseType<
  (typeof client.api.uploads.blog)[":slug"]["images"]["$get"],
  200
>[number];

type PostForm = {
  slug: string;
  title: string;
  description: string;
  body: string;
  coverImageUrl: string;
  tags: string[];
  status: PostStatus;
  publishedAt: string;
};

const blank: PostForm = {
  slug: "",
  title: "",
  description: "",
  body: "",
  coverImageUrl: "",
  tags: [],
  status: POST_STATUS.DRAFT,
  publishedAt: "",
};

export default function BlogAdminPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [form, setForm] = useState<PostForm>(blank);
  const [baseline, setBaseline] = useState<PostForm>(blank);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inserting, setInserting] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [images, setImages] = useState<BlogImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { setGuard } = useUnsavedGuard();

  async function load() {
    const res = await client.api.blog.admin.all.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function persist(data: PostForm, editing: string | null) {
    const slug = data.slug.trim();
    if (!SLUG_REGEX.test(slug) || !data.title || !data.body) return 0;
    const publishedAt =
      data.status === POST_STATUS.PUBLISHED && !data.publishedAt
        ? new Date().toISOString()
        : data.publishedAt || null;
    const json: PostJson = {
      slug,
      title: data.title,
      description: data.description || null,
      body: data.body,
      coverImageUrl: data.coverImageUrl || null,
      status: data.status,
      publishedAt,
      tags: data.tags,
    };
    const res = editing
      ? await client.api.blog[":slug"].$put({ param: { slug: editing }, json })
      : await client.api.blog.$post({ json });
    if (res.ok) {
      const saved = { ...data, slug, publishedAt: publishedAt ?? "" };
      setBaseline(saved);
      setForm(saved);
      setEditingSlug(slug);
      await load();
    }
    return res.status;
  }

  const guardRef = useRef<{
    isDirty: () => boolean;
    save: () => Promise<boolean>;
  }>({
    isDirty: () => false,
    save: async () => false,
  });

  useEffect(() => {
    guardRef.current = {
      isDirty: () => JSON.stringify(form) !== JSON.stringify(baseline),
      save: async () => {
        const status = await persist(form, editingSlug);
        return status >= 200 && status < 300;
      },
    };
  });

  useEffect(() => {
    setGuard({
      isDirty: () => guardRef.current.isDirty(),
      save: () => guardRef.current.save(),
    });
    return () => setGuard(null);
  }, [setGuard]);

  function reset() {
    setForm(blank);
    setBaseline(blank);
    setEditingSlug(null);
    setError("");
  }

  function edit(post: Post) {
    const loaded: PostForm = {
      slug: post.slug,
      title: post.title,
      description: post.description ?? "",
      body: post.body,
      coverImageUrl: post.coverImageUrl ?? "",
      tags: post.tags ?? [],
      status: post.status,
      publishedAt: post.publishedAt ?? "",
    };
    setEditingSlug(post.slug);
    setError("");
    setForm(loaded);
    setBaseline(loaded);
  }

  async function openImages() {
    const slug = form.slug.trim();
    if (!SLUG_REGEX.test(slug)) {
      setError(
        "アップロード済み画像を表示するには、先に slug を入力してください。",
      );
      return;
    }
    setImagesOpen(true);
    setImagesLoading(true);
    setImagesError("");
    setImages([]);
    try {
      const res = await client.api.uploads.blog[":slug"].images.$get({
        param: { slug },
      });
      if (res.ok) setImages(await res.json());
      else setImagesError("画像の取得に失敗しました。");
    } catch {
      setImagesError("画像の取得に失敗しました。");
    } finally {
      setImagesLoading(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }

  async function deleteImage(publicId: string) {
    const slug = form.slug.trim();
    if (!window.confirm("この画像を削除しますか？")) return;
    const res = await client.api.uploads.blog[":slug"].image.$delete({
      param: { slug },
      json: { publicId },
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } else {
      setImagesError("画像の削除に失敗しました。");
    }
  }

  async function uploadCover(file: File) {
    const { url } = await uploadToCloudinary(file, { folder: BLOG_FOLDER });
    setForm((f) => ({ ...f, coverImageUrl: url }));
  }

  function insertAtCursor(text: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setForm((f) => ({ ...f, body: f.body + text }));
      return;
    }
    const { selectionStart: start, selectionEnd: end } = ta;
    setForm((f) => ({
      ...f,
      body: f.body.slice(0, start) + text + f.body.slice(end),
    }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function insertImage(file: File) {
    const slug = form.slug.trim();
    if (!SLUG_REGEX.test(slug)) {
      setError(
        "本文に画像を挿入するには、先に slug（英小文字・数字・ハイフン）を入力してください。",
      );
      return;
    }
    setInserting(true);
    setError("");
    try {
      const { url } = await uploadToCloudinary(file, {
        folder: `${BLOG_FOLDER}/${slug}`,
      });
      insertAtCursor(`\n![](${url})\n`);
    } catch {
      setError("画像のアップロードに失敗しました。");
    } finally {
      setInserting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const status = await persist(form, editingSlug);
    if (status >= 200 && status < 300) {
      reset();
    } else if (status === 409) {
      setError("その slug は既に使われています。");
    } else if (status === 0) {
      setError(
        "slug（英小文字・数字・ハイフン）・タイトル・本文を入力してください。",
      );
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
                <span className={`badge badge--${post.status}`}>
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
              pattern={SLUG_PATTERN}
              placeholder="my-post"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <p className="field__hint">
              本文への画像挿入には slug が必要です（保存先 {BLOG_FOLDER}
              /&#123;slug&#125;）。
            </p>
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
          <div className="editor-head">
            <label htmlFor="body">本文 (Markdown)</label>
            <div className="editor-head__actions">
              <UploadButton
                label={inserting ? "挿入中…" : "本文に画像を挿入"}
                disabled={inserting}
                onSelect={insertImage}
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={openImages}
              >
                アップロード済み画像
              </button>
            </div>
          </div>
          <div className="editor-2pane">
            <textarea
              id="body"
              ref={bodyRef}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
            <div className="editor-preview prose">
              {form.body ? (
                <MarkdownContent>{form.body}</MarkdownContent>
              ) : (
                <p className="muted">プレビューがここに表示されます。</p>
              )}
            </div>
          </div>
        </div>
        <div className="field">
          <label htmlFor="tags">タグ</label>
          <TagInput
            id="tags"
            value={form.tags}
            onChange={(tags) => setForm({ ...form, tags })}
            placeholder="Enter で追加"
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
                  status: e.target.value as PostStatus,
                })
              }
            >
              <option value={POST_STATUS.DRAFT}>{POST_STATUS.DRAFT}</option>
              <option value={POST_STATUS.PUBLISHED}>
                {POST_STATUS.PUBLISHED}
              </option>
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

      {imagesOpen && (
        <Modal wide onClose={() => setImagesOpen(false)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: "1.2rem" }}>アップロード済み画像</h2>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setImagesOpen(false)}
            >
              閉じる
            </button>
          </div>
          {imagesLoading && <p className="muted">読み込み中…</p>}
          {imagesError && <p className="form-error">{imagesError}</p>}
          {!imagesLoading && !imagesError && images.length === 0 && (
            <p className="muted">
              この記事にアップロードされた画像はありません。
            </p>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {images.map((img) => (
              <figure
                key={img.publicId}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
                <input
                  type="text"
                  readOnly
                  value={img.url}
                  onFocus={(e) => e.target.select()}
                  style={{ fontSize: "0.75rem", width: "100%" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      insertAtCursor(`\n![](${img.url})\n`);
                      setImagesOpen(false);
                    }}
                  >
                    本文に挿入
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => copyUrl(img.url)}
                  >
                    URLコピー
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => deleteImage(img.publicId)}
                  >
                    削除
                  </button>
                </div>
              </figure>
            ))}
          </div>
        </Modal>
      )}
    </main>
  );
}

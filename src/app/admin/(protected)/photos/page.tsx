"use client";

import type { InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type Photo = InferResponseType<typeof client.api.photos.$get>[number];

type PhotoForm = {
  title: string;
  description: string;
  takenAt: string;
  sortOrder: number;
};

export default function PhotosAdminPage() {
  const [items, setItems] = useState<Photo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<PhotoForm>({
    title: "",
    description: "",
    takenAt: "",
    sortOrder: 0,
  });

  async function load() {
    const res = await client.api.photos.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement;
    const titleInput = formEl.elements.namedItem("title") as HTMLInputElement;
    if (!fileInput.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    if (titleInput.value) fd.append("title", titleInput.value);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      formEl.reset();
      await load();
    }
  }

  function edit(photo: Photo) {
    setEditingId(photo.id);
    setForm({
      title: photo.title ?? "",
      description: photo.description ?? "",
      takenAt: photo.takenAt ?? "",
      sortOrder: photo.sortOrder,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const res = await client.api.photos[":id"].$put({
      param: { id: editingId },
      json: {
        title: form.title || null,
        description: form.description || null,
        takenAt: form.takenAt || null,
        sortOrder: form.sortOrder,
      },
    });
    if (res.ok) {
      setEditingId(null);
      await load();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("この写真を削除しますか？")) return;
    const res = await client.api.photos[":id"].$delete({ param: { id } });
    if (res.ok) {
      if (editingId === id) setEditingId(null);
      await load();
    }
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="写真" />

      <form
        className="panel"
        onSubmit={upload}
        style={{ marginBottom: "var(--space-5)", maxWidth: 520 }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "var(--space-4)" }}>
          写真をアップロード
        </h2>
        <div className="field">
          <label htmlFor="file">画像ファイル</label>
          <input id="file" name="file" type="file" accept="image/*" required />
        </div>
        <div className="field">
          <label htmlFor="title">タイトル（任意）</label>
          <input id="title" name="title" type="text" />
        </div>
        <button type="submit" className="btn" disabled={uploading}>
          {uploading ? "アップロード中…" : "アップロード"}
        </button>
      </form>

      {editingId && (
        <form
          className="panel"
          onSubmit={save}
          style={{ marginBottom: "var(--space-5)", maxWidth: 520 }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "var(--space-4)" }}>
            写真情報を編集
          </h2>
          <div className="field">
            <label htmlFor="edit-title">タイトル</label>
            <input
              id="edit-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-description">説明</label>
            <textarea
              id="edit-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="edit-takenAt">撮影日</label>
              <input
                id="edit-takenAt"
                type="text"
                placeholder="2026-06-18"
                value={form.takenAt}
                onChange={(e) => setForm({ ...form, takenAt: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="edit-sortOrder">表示順</label>
              <input
                id="edit-sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button type="submit" className="btn">
              保存
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setEditingId(null)}
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {items.length > 0 ? (
        <div className="photo-admin-grid">
          {items.map((photo) => (
            <figure key={photo.id}>
              {photo.url ? (
                <img src={photo.url} alt={photo.title ?? ""} />
              ) : (
                <div
                  className="photo-placeholder"
                  style={{ aspectRatio: "1 / 1" }}
                />
              )}
              <figcaption>
                <span>{photo.title ?? "（無題）"}</span>
                <span style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => edit(photo)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(photo.id)}
                  >
                    削除
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">写真がありません。アップロードしてください。</p>
      )}
    </main>
  );
}

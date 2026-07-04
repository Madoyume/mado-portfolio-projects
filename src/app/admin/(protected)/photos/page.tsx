"use client";

import type { InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { TagInput } from "@/components/admin/tag-input";
import { AdminTopbar } from "@/components/admin/topbar";
import { UploadButton } from "@/components/admin/upload-button";
import { PHOTOS_FOLDER } from "@/lib/constants";
import { client } from "@/lib/rpc";
import { uploadToCloudinary } from "@/lib/upload";

type Photo = InferResponseType<
  typeof client.api.photos.admin.all.$get,
  200
>[number];

type PhotoForm = {
  title: string;
  description: string;
  takenAt: string;
  tags: string[];
};

export default function PhotosAdminPage() {
  const [items, setItems] = useState<Photo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<PhotoForm>({
    title: "",
    description: "",
    takenAt: "",
    tags: [],
  });

  async function load() {
    const res = await client.api.photos.admin.all.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    try {
      const { publicId, width, height } = await uploadToCloudinary(file, {
        folder: PHOTOS_FOLDER,
      });
      await client.api.photos.$post({
        json: { cloudinaryPublicId: publicId, width, height },
      });
      await load();
    } finally {
      setUploading(false);
    }
  }

  function edit(photo: Photo) {
    setEditingId(photo.id);
    setForm({
      title: photo.title ?? "",
      description: photo.description ?? "",
      takenAt: photo.takenAt ?? "",
      tags: photo.tags ?? [],
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
        tags: form.tags,
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

      <div
        className="panel"
        style={{ marginBottom: "var(--space-5)", maxWidth: 520 }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "var(--space-3)" }}>
          写真をアップロード
        </h2>
        <UploadButton
          label={uploading ? "アップロード中…" : "画像を選択してアップロード"}
          disabled={uploading}
          onSelect={upload}
        />
        <p className="field__hint" style={{ marginTop: "var(--space-2)" }}>
          選択すると即アップロードされます。タイトル等は下の「編集」から設定できます。
        </p>
      </div>

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
            <label htmlFor="edit-tags">タグ</label>
            <TagInput
              id="edit-tags"
              value={form.tags}
              onChange={(tags) => setForm({ ...form, tags })}
              placeholder="Enter で追加"
            />
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

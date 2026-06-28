"use client";

import type { InferRequestType, InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type Career = InferResponseType<typeof client.api.careers.$get>[number];
type CareerForm = InferRequestType<typeof client.api.careers.$post>["json"];

const blank: CareerForm = {
  company: "",
  role: "",
  description: "",
  startedAt: "",
  endedAt: "",
  sortOrder: 0,
};

export default function CareersAdminPage() {
  const [items, setItems] = useState<Career[]>([]);
  const [form, setForm] = useState<CareerForm>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await client.api.careers.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm(blank);
    setEditingId(null);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const json: CareerForm = {
      ...form,
      description: form.description || null,
      endedAt: form.endedAt || null,
    };
    const res = editingId
      ? await client.api.careers[":id"].$put({
          param: { id: editingId },
          json,
        })
      : await client.api.careers.$post({ json });
    if (res.ok) {
      reset();
      await load();
    } else {
      setError("保存に失敗しました。入力を確認してください。");
    }
  }

  function edit(career: Career) {
    setEditingId(career.id);
    setError("");
    setForm({
      company: career.company,
      role: career.role,
      description: career.description ?? "",
      startedAt: career.startedAt,
      endedAt: career.endedAt ?? "",
      sortOrder: career.sortOrder,
    });
  }

  async function remove(id: string) {
    if (!window.confirm("この経歴を削除しますか？")) return;
    const res = await client.api.careers[":id"].$delete({ param: { id } });
    if (res.ok) {
      if (editingId === id) reset();
      await load();
    }
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="経歴" />
      <div className="editor-grid">
        <table className="table">
          <thead>
            <tr>
              <th>会社</th>
              <th>役割</th>
              <th>期間</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((career) => (
              <tr key={career.id}>
                <td>{career.company}</td>
                <td>{career.role}</td>
                <td>
                  {career.startedAt} – {career.endedAt ?? "現在"}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => edit(career)}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(career.id)}
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
            {editingId ? "経歴を編集" : "経歴を追加"}
          </h2>
          <div className="field">
            <label htmlFor="company">会社・組織</label>
            <input
              id="company"
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="role">役割</label>
            <input
              id="role"
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">業務内容</label>
            <textarea
              id="description"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="startedAt">開始 (YYYY-MM)</label>
              <input
                id="startedAt"
                type="text"
                placeholder="2023-04"
                value={form.startedAt}
                onChange={(e) =>
                  setForm({ ...form, startedAt: e.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="endedAt">終了 (空=現在)</label>
              <input
                id="endedAt"
                type="text"
                placeholder="2025-03"
                value={form.endedAt ?? ""}
                onChange={(e) => setForm({ ...form, endedAt: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sortOrder">表示順</label>
            <input
              id="sortOrder"
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button type="submit" className="btn">
              {editingId ? "更新" : "追加"}
            </button>
            {editingId && (
              <button type="button" className="btn btn--ghost" onClick={reset}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

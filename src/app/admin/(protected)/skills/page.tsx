"use client";

import type { InferRequestType, InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type Skill = InferResponseType<typeof client.api.skills.$get>[number];
type SkillForm = InferRequestType<typeof client.api.skills.$post>["json"];

const blank: SkillForm = {
  name: "",
  category: "",
  level: null,
};

export default function SkillsAdminPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [form, setForm] = useState<SkillForm>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await client.api.skills.$get();
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
    const res = editingId
      ? await client.api.skills[":id"].$put({
          param: { id: editingId },
          json: form,
        })
      : await client.api.skills.$post({ json: form });
    if (res.ok) {
      reset();
      await load();
    } else {
      setError("保存に失敗しました。入力を確認してください。");
    }
  }

  function edit(skill: Skill) {
    setEditingId(skill.id);
    setError("");
    setForm({
      name: skill.name,
      category: skill.category,
      level: skill.level,
    });
  }

  async function remove(id: string) {
    if (!window.confirm("このスキルを削除しますか？")) return;
    const res = await client.api.skills[":id"].$delete({ param: { id } });
    if (res.ok) {
      if (editingId === id) reset();
      await load();
    }
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="スキル" />
      <div className="editor-grid">
        <table className="table">
          <thead>
            <tr>
              <th>スキル</th>
              <th>分類</th>
              <th>習熟</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((skill) => (
              <tr key={skill.id}>
                <td>{skill.name}</td>
                <td>{skill.category}</td>
                <td>{skill.level ?? "—"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => edit(skill)}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(skill.id)}
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
            {editingId ? "スキルを編集" : "スキルを追加"}
          </h2>
          <div className="field">
            <label htmlFor="name">スキル名</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="category">分類</label>
            <input
              id="category"
              type="text"
              placeholder="Language / Frontend / Backend / Infra"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="level">習熟度 (1-5)</label>
            <input
              id="level"
              type="number"
              min={1}
              max={5}
              value={form.level ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  level: e.target.value ? Number(e.target.value) : null,
                })
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

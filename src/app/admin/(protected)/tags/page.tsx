"use client";

import { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type Category = {
  id: string;
  name: string;
  tags: { id: string; name: string }[];
};

export default function TagsAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await client.api["tag-categories"].$get();
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await client.api["tag-categories"].$post({ json: { name } });
    if (!res.ok) {
      setError(
        res.status === 409
          ? "同名の親タグが既にあります。"
          : "作成に失敗しました。",
      );
      return;
    }
    setName("");
    await load();
  }

  async function renameCategory(category: Category) {
    const name = window.prompt("親タグ名", category.name)?.trim();
    if (!name || name === category.name) return;
    const res = await client.api["tag-categories"][":id"].$put({
      param: { id: category.id },
      json: { name },
    });
    if (!res.ok) setError("親タグの更新に失敗しました。");
    await load();
  }

  async function removeCategory(category: Category) {
    if (!window.confirm(`「${category.name}」を削除しますか？`)) return;
    const res = await client.api["tag-categories"][":id"].$delete({
      param: { id: category.id },
    });
    if (!res.ok) setError("子タグが残る親タグは削除できません。");
    await load();
  }

  async function renameTag(id: string, current: string) {
    const name = window.prompt("子タグ名", current)?.trim();
    if (!name || name === current) return;
    const res = await client.api["tag-categories"].children[":id"].$put({
      param: { id },
      json: { name },
    });
    if (!res.ok)
      setError(
        "子タグの更新に失敗しました。同名タグがある場合は統合してください。",
      );
    await load();
  }

  async function mergeTag(id: string, current: string) {
    const name = window.prompt("統合先の子タグ名", current)?.trim();
    if (!name || name === current) return;
    const candidates = categories.flatMap((category) => category.tags);
    const target = candidates.find((tag) => tag.name === name);
    if (!target || target.id === id) {
      setError("統合先は登録済みの別の子タグ名を入力してください。");
      return;
    }
    const res = await client.api["tag-categories"].children[":id"].merge.$post({
      param: { id },
      json: { targetTagId: target.id },
    });
    if (!res.ok) setError("子タグの統合に失敗しました。");
    await load();
  }

  async function removeTag(id: string, name: string) {
    if (!window.confirm(`未使用の子タグ「${name}」を削除しますか？`)) return;
    const res = await client.api["tag-categories"].children[":id"].$delete({
      param: { id },
    });
    if (!res.ok)
      setError("使用中の子タグは削除できません。統合を利用してください。");
    await load();
  }

  return (
    <main className="admin__main">
      <AdminTopbar title="タグ管理" />
      <form className="panel" onSubmit={create} style={{ maxWidth: 560 }}>
        <div className="field">
          <label htmlFor="category-name">親タグを追加</label>
          <input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Develop"
            required
          />
        </div>
        <button type="submit" className="btn">
          追加
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>
      <div className="tag-admin-list">
        {categories.map((category) => (
          <section className="panel" key={category.id}>
            <div className="section__head tag-admin-list__head">
              <h2>{category.name}</h2>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => renameCategory(category)}
                >
                  名前変更
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => removeCategory(category)}
                >
                  削除
                </button>
              </div>
            </div>
            {category.tags.length ? (
              <div className="tags">
                {category.tags.map((tag) => (
                  <span className="tag-admin-list__tag" key={tag.id}>
                    <span className="tag">{tag.name}</span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => renameTag(tag.id, tag.name)}
                    >
                      改名
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => mergeTag(tag.id, tag.name)}
                    >
                      統合
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => removeTag(tag.id, tag.name)}
                    >
                      削除
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted">
                子タグは記事・写真の編集画面から追加できます。
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

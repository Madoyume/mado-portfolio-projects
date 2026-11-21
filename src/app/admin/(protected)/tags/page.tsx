"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/admin/modal";
import { AdminTopbar } from "@/components/admin/topbar";
import { client } from "@/lib/rpc";

type Tag = { id: string; name: string };
type Category = { id: string; name: string; tags: Tag[] };
type Dialog =
  | { type: "create" }
  | { type: "rename-category"; category: Category }
  | { type: "delete-category"; category: Category }
  | { type: "rename-tag"; category: Category; tag: Tag }
  | { type: "merge-tag"; category: Category; tag: Tag }
  | { type: "delete-tag"; category: Category; tag: Tag };

export default function TagsAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [name, setName] = useState("");
  const [targetTagId, setTargetTagId] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    const res = await client.api["tag-categories"].$get();
    if (res.ok) {
      setCategories(await res.json());
      return;
    }
    setError("タグ分類の取得に失敗しました。");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setModalError("");
    setName("");
    setTargetTagId("");
  }, []);

  function openDialog(next: Dialog) {
    setError("");
    setModalError("");
    setName(
      next.type === "rename-category"
        ? next.category.name
        : next.type === "rename-tag"
          ? next.tag.name
          : "",
    );
    setTargetTagId("");
    setDialog(next);
  }

  async function submitName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || !dialog) return;

    const res =
      dialog.type === "create"
        ? await client.api["tag-categories"].$post({ json: { name: nextName } })
        : dialog.type === "rename-category"
          ? await client.api["tag-categories"][":id"].$put({
              param: { id: dialog.category.id },
              json: { name: nextName },
            })
          : dialog.type === "rename-tag"
            ? await client.api["tag-categories"].children[":id"].$put({
                param: { id: dialog.tag.id },
                json: { name: nextName },
              })
            : null;
    if (!res) return;
    if (!res.ok) {
      setModalError(
        res.status === 409
          ? "同じ名前が既に登録されています。"
          : "保存に失敗しました。入力内容を確認してください。",
      );
      return;
    }
    closeDialog();
    await load();
  }

  async function mergeTag() {
    if (dialog?.type !== "merge-tag" || !targetTagId) return;
    const res = await client.api["tag-categories"].children[":id"].merge.$post({
      param: { id: dialog.tag.id },
      json: { targetTagId },
    });
    if (!res.ok) {
      setModalError("統合に失敗しました。もう一度お試しください。");
      return;
    }
    closeDialog();
    await load();
  }

  async function remove() {
    if (
      !dialog ||
      (dialog.type !== "delete-category" && dialog.type !== "delete-tag")
    )
      return;
    const res =
      dialog.type === "delete-category"
        ? await client.api["tag-categories"][":id"].$delete({
            param: { id: dialog.category.id },
          })
        : await client.api["tag-categories"].children[":id"].$delete({
            param: { id: dialog.tag.id },
          });
    if (!res.ok) {
      setModalError(
        dialog.type === "delete-category"
          ? "子タグが残る親タグは削除できません。"
          : "利用中の子タグは削除できません。統合を利用してください。",
      );
      return;
    }
    closeDialog();
    await load();
  }

  const mergeTargets =
    dialog?.type === "merge-tag"
      ? dialog.category.tags.filter((tag) => tag.id !== dialog.tag.id)
      : [];
  const isNameDialog =
    dialog?.type === "create" ||
    dialog?.type === "rename-category" ||
    dialog?.type === "rename-tag";

  return (
    <main className="admin__main">
      <AdminTopbar title="タグ管理" />
      <section className="tag-admin__intro" aria-label="タグ管理の操作">
        <div>
          <p className="eyebrow">CONTENT TAXONOMY</p>
          <p className="tag-admin__description">
            親タグを整理し、子タグは記事・写真の編集時に登録します。
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => openDialog({ type: "create" })}
        >
          親タグを追加
        </button>
      </section>
      {error && <p className="form-error">{error}</p>}
      {categories.length ? (
        <div className="tag-admin-list">
          {categories.map((category) => (
            <section className="panel tag-admin-card" key={category.id}>
              <header className="tag-admin-card__head">
                <div>
                  <h2>{category.name}</h2>
                  <p>{category.tags.length}件の子タグ</p>
                </div>
                <details className="action-menu">
                  <summary aria-label={`${category.name}の操作`}>…</summary>
                  <div className="action-menu__items" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        openDialog({ type: "rename-category", category })
                      }
                    >
                      名前を変更
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={category.tags.length > 0}
                      title={
                        category.tags.length
                          ? "子タグを整理してから削除できます"
                          : undefined
                      }
                      onClick={() =>
                        openDialog({ type: "delete-category", category })
                      }
                    >
                      削除
                    </button>
                  </div>
                </details>
              </header>
              {category.tags.length ? (
                <div className="tag-admin-card__tags">
                  {category.tags.map((tag) => (
                    <div className="tag-admin-card__tag" key={tag.id}>
                      <span className="tag">{tag.name}</span>
                      <details className="action-menu">
                        <summary aria-label={`${tag.name}の操作`}>…</summary>
                        <div className="action-menu__items" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              openDialog({
                                type: "rename-tag",
                                category,
                                tag,
                              })
                            }
                          >
                            改名
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={category.tags.length < 2}
                            onClick={() =>
                              openDialog({
                                type: "merge-tag",
                                category,
                                tag,
                              })
                            }
                          >
                            統合
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              openDialog({
                                type: "delete-tag",
                                category,
                                tag,
                              })
                            }
                          >
                            削除
                          </button>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tag-admin-card__empty">タグなし</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <section className="panel tag-admin-empty">
          <p>親タグがまだありません。</p>
        </section>
      )}

      {dialog && (
        <Modal onClose={closeDialog}>
          {isNameDialog && (
            <form onSubmit={submitName}>
              <div className="modal__head">
                <h2>
                  {dialog.type === "create"
                    ? "親タグを追加"
                    : dialog.type === "rename-category"
                      ? "親タグ名を変更"
                      : "子タグ名を変更"}
                </h2>
              </div>
              <div className="field">
                <label htmlFor="tag-dialog-name">
                  {dialog.type === "rename-tag" ? "子タグ名" : "親タグ名"}
                </label>
                <input
                  autoFocus
                  id="tag-dialog-name"
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </div>
              {modalError && <p className="form-error">{modalError}</p>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeDialog}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn">
                  保存
                </button>
              </div>
            </form>
          )}

          {dialog.type === "merge-tag" && (
            <div>
              <div className="modal__head">
                <h2>子タグを統合</h2>
              </div>
              <p className="modal__description">
                「{dialog.tag.name}
                」に紐づく記事・写真を、選択した子タグへ移します。
              </p>
              <div className="field">
                <label htmlFor="merge-target">統合先</label>
                <select
                  id="merge-target"
                  value={targetTagId}
                  onChange={(event) => setTargetTagId(event.target.value)}
                >
                  <option value="">統合先を選択</option>
                  {mergeTargets.map((tag) => (
                    <option value={tag.id} key={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              {modalError && <p className="form-error">{modalError}</p>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeDialog}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!targetTagId}
                  onClick={mergeTag}
                >
                  統合する
                </button>
              </div>
            </div>
          )}

          {(dialog.type === "delete-category" ||
            dialog.type === "delete-tag") && (
            <div>
              <div className="modal__head">
                <h2>削除の確認</h2>
              </div>
              <p className="modal__description">
                「
                {dialog.type === "delete-category"
                  ? dialog.category.name
                  : dialog.tag.name}
                」を削除します。この操作は元に戻せません。
              </p>
              {modalError && <p className="form-error">{modalError}</p>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeDialog}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={remove}
                >
                  削除する
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}

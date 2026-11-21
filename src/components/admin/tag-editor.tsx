"use client";

import { type KeyboardEvent, useEffect, useId, useState } from "react";
import { client } from "@/lib/rpc";

export type TagGroupValue = { categoryId: string; names: string[] };

type TagCategory = {
  id: string;
  name: string;
  tags: { id: string; name: string }[];
};

export function TagEditor({
  value,
  onChange,
}: {
  value: TagGroupValue[];
  onChange: (value: TagGroupValue[]) => void;
}) {
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [draft, setDraft] = useState("");
  const listId = useId();
  const selected = categories.find((category) => category.id === categoryId);

  useEffect(() => {
    async function load() {
      const res = await client.api["tag-categories"].$get();
      if (res.ok) setCategories(await res.json());
    }
    load();
  }, []);

  function add() {
    const name = draft.trim();
    if (!categoryId || !name) return;
    const group = value.find((item) => item.categoryId === categoryId);
    if (
      group?.names.some(
        (item) => item.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setDraft("");
      return;
    }
    const next = group
      ? value.map((item) =>
          item.categoryId === categoryId
            ? { ...item, names: [...item.names, name] }
            : item,
        )
      : [...value, { categoryId, names: [name] }];
    onChange(next);
    setDraft("");
  }

  function remove(groupId: string, name: string) {
    onChange(
      value.flatMap((group) => {
        if (group.categoryId !== groupId) return [group];
        const names = group.names.filter((item) => item !== name);
        return names.length ? [{ ...group, names }] : [];
      }),
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    }
  }

  return (
    <div className="tag-editor">
      <div className="tag-editor__controls">
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">親タグを選択</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          list={listId}
          value={draft}
          disabled={!categoryId}
          placeholder={
            categoryId ? "子タグを入力して Enter" : "親タグを選択してください"
          }
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
        />
        <datalist id={listId}>
          {selected?.tags.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
      </div>
      {value.map((group) => {
        const category = categories.find(
          (item) => item.id === group.categoryId,
        );
        return (
          <div className="tag-editor__group" key={group.categoryId}>
            <span>{category?.name ?? "不明な分類"}</span>
            {group.names.map((name) => (
              <button
                type="button"
                className="tag-chip"
                key={name}
                onClick={() => remove(group.categoryId, name)}
              >
                {name} ×
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

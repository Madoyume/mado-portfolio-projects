"use client";

import { useRouter } from "next/navigation";

type TagCategory = {
  id: string;
  name: string;
  tags: { id: string; name: string }[];
};

export function TagFilter({
  categories,
  pathname,
  categoryId,
  tagId,
  month,
}: {
  categories: TagCategory[];
  pathname: string;
  categoryId?: string;
  tagId?: string;
  month?: string;
}) {
  const router = useRouter();
  const category = categories.find((item) => item.id === categoryId);

  function navigate(nextCategoryId?: string, nextTagId?: string) {
    const params = new URLSearchParams();
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (nextTagId) params.set("tagId", nextTagId);
    if (month) params.set("month", month);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  if (categories.length === 0) return null;
  return (
    <div className="tag-filter">
      <label>
        分類
        <select
          value={categoryId ?? ""}
          onChange={(event) => navigate(event.target.value || undefined)}
        >
          <option value="">すべて</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {category && (
        <label>
          タグ
          <select
            value={tagId ?? ""}
            onChange={(event) =>
              navigate(category.id, event.target.value || undefined)
            }
          >
            <option value="">すべてのタグ</option>
            {category.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

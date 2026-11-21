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
    <nav className="tag-filter" aria-label="タグで絞り込み">
      <div className="tag-filter__row">
        <span className="tag-filter__label">分類</span>
        <div className="tag-filter__chips" role="group" aria-label="分類">
          <button
            type="button"
            className="tag-filter__chip"
            aria-pressed={!categoryId}
            onClick={() => navigate()}
          >
            すべて
          </button>
          {categories.map((item) => (
            <button
              type="button"
              className="tag-filter__chip"
              aria-pressed={item.id === categoryId}
              key={item.id}
              onClick={() => navigate(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      {category && (
        <div className="tag-filter__row">
          <span className="tag-filter__label">タグ</span>
          <div className="tag-filter__chips" role="group" aria-label="タグ">
            <button
              type="button"
              className="tag-filter__chip"
              aria-pressed={!tagId}
              onClick={() => navigate(category.id)}
            >
              すべて
            </button>
            {category.tags.map((tag) => (
              <button
                type="button"
                className="tag-filter__chip"
                aria-pressed={tag.id === tagId}
                key={tag.id}
                onClick={() => navigate(category.id, tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

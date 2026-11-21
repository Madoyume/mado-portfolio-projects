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
  categoryName,
  tagName,
  month,
}: {
  categories: TagCategory[];
  pathname: string;
  categoryName?: string;
  tagName?: string;
  month?: string;
}) {
  const router = useRouter();
  const category = categories.find((item) => item.name === categoryName);

  function navigate(nextCategoryName?: string, nextTagName?: string) {
    const params = new URLSearchParams();
    if (nextCategoryName) params.set("category", nextCategoryName);
    if (nextTagName) params.set("tag", nextTagName);
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
            aria-pressed={!categoryName}
            onClick={() => navigate()}
          >
            すべて
          </button>
          {categories.map((item) => (
            <button
              type="button"
              className="tag-filter__chip"
              aria-pressed={item.name === categoryName}
              key={item.id}
              onClick={() => navigate(item.name)}
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
              aria-pressed={!tagName}
              onClick={() => navigate(category.name)}
            >
              すべて
            </button>
            {category.tags.map((tag) => (
              <button
                type="button"
                className="tag-filter__chip"
                aria-pressed={tag.name === tagName}
                key={tag.id}
                onClick={() => navigate(category.name, tag.name)}
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

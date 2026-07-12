"use client";

export function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="ページ切り替え">
      {page > 1 && (
        <button
          type="button"
          className="pagination__btn"
          aria-label="前のページ"
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
      )}
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          className="pagination__btn"
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      {page < pageCount && (
        <button
          type="button"
          className="pagination__btn"
          aria-label="次のページ"
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      )}
    </nav>
  );
}

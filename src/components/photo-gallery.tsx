"use client";

import type { InferResponseType } from "hono/client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  GALLERY_COLUMNS,
  GALLERY_COLUMNS_NARROW,
  GALLERY_NARROW_QUERY,
  PHOTOS_PAGE_SIZE,
} from "@/lib/constants";
import { distributeToColumns } from "@/lib/masonry";
import { client } from "@/lib/rpc";

type Photo = InferResponseType<
  typeof client.api.photos.$get,
  200
>["items"][number];

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(GALLERY_NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getColumnCount() {
  return window.matchMedia(GALLERY_NARROW_QUERY).matches
    ? GALLERY_COLUMNS_NARROW
    : GALLERY_COLUMNS;
}

function getServerColumnCount() {
  return GALLERY_COLUMNS;
}

export function PhotoGallery({
  initialItems,
  initialCursor,
  category,
  tag,
  month,
}: {
  initialItems: Photo[];
  initialCursor: string | null;
  category?: string;
  tag?: string;
  month?: string;
}) {
  const [photos, setPhotos] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const columnCount = useSyncExternalStore(
    subscribeNarrow,
    getColumnCount,
    getServerColumnCount,
  );
  const columns = distributeToColumns(photos, columnCount);

  const viewable = photos.filter((p) => p.url);
  const current = index !== null ? viewable[index] : null;

  const move = (delta: number) => {
    if (index === null) return;
    setIndex((index + delta + viewable.length) % viewable.length);
  };

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await client.api.photos.$get({
        query: {
          limit: String(PHOTOS_PAGE_SIZE),
          cursor,
          ...(category ? { category } : {}),
          ...(tag ? { tag } : {}),
          ...(month ? { month } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }, [category, cursor, loading, month, tag]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <>
      <div className="gallery">
        {columns.map((column, columnIndex) => (
          <div className="gallery__column" key={columnIndex}>
            {column.map((photo) => {
              if (!photo.url) {
                return (
                  <figure key={photo.id}>
                    <div className="photo-placeholder" />
                  </figure>
                );
              }
              const pos = viewable.findIndex((p) => p.id === photo.id);
              return (
                <figure
                  key={photo.id}
                  onClick={() => setIndex(pos)}
                  onKeyDown={(e) => e.key === "Enter" && setIndex(pos)}
                  tabIndex={0}
                  role="button"
                  aria-label={photo.title ?? "写真を拡大"}
                >
                  <img
                    src={photo.url}
                    alt={photo.title ?? ""}
                    width={photo.width ?? undefined}
                    height={photo.height ?? undefined}
                    loading="lazy"
                  />
                  {photo.title && <figcaption>{photo.title}</figcaption>}
                </figure>
              );
            })}
          </div>
        ))}
      </div>

      {cursor && <div ref={sentinel} className="gallery__sentinel" />}
      {loading && <p className="muted">読み込み中…</p>}

      {current && (
        <div
          className="lightbox"
          onClick={() => setIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox__close"
            aria-label="閉じる"
            onClick={() => setIndex(null)}
          >
            ×
          </button>
          {viewable.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                aria-label="前へ"
                onClick={(e) => {
                  e.stopPropagation();
                  move(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                aria-label="次へ"
                onClick={(e) => {
                  e.stopPropagation();
                  move(1);
                }}
              >
                ›
              </button>
            </>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <img src={current.url ?? ""} alt={current.title ?? ""} />
            {current.title && <p className="lightbox__cap">{current.title}</p>}
          </div>
        </div>
      )}
    </>
  );
}

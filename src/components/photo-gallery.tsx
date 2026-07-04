"use client";

import type { InferResponseType } from "hono/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHOTOS_PAGE_SIZE } from "@/lib/constants";
import { client } from "@/lib/rpc";

type Photo = InferResponseType<
  typeof client.api.photos.$get,
  200
>["items"][number];

export function PhotoGallery({
  initialItems,
  initialCursor,
  tag,
}: {
  initialItems: Photo[];
  initialCursor: string | null;
  tag?: string;
}) {
  const [photos, setPhotos] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

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
          ...(tag ? { tag } : {}),
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
  }, [cursor, loading, tag]);

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
        {photos.map((photo) => {
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
              <img src={photo.url} alt={photo.title ?? ""} loading="lazy" />
              {photo.title && <figcaption>{photo.title}</figcaption>}
            </figure>
          );
        })}
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

"use client";

import { useState } from "react";
import type { getPhotos } from "@/lib/api";

type Photo = Awaited<ReturnType<typeof getPhotos>>[number];

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const viewable = photos.filter((p) => p.url);
  const current = index !== null ? viewable[index] : null;

  const move = (delta: number) => {
    if (index === null) return;
    setIndex((index + delta + viewable.length) % viewable.length);
  };

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

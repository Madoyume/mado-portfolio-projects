import Link from "next/link";
import { PhotoGallery } from "@/components/photo-gallery";
import { getPhotos, getPhotoTags } from "@/lib/api";
import { PHOTOS_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos" };

export default async function Photos({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [{ items, nextCursor }, tags] = await Promise.all([
    getPhotos({ tag, limit: PHOTOS_PAGE_SIZE }),
    getPhotoTags(),
  ]);

  return (
    <main className="section container container-wide">
      <div className="section__head">
        <span className="eyebrow">Gallery</span>
        <h2>写真</h2>
      </div>

      {tags.length > 0 && (
        <div className="filters">
          <Link href="/photos" className="tag" aria-pressed={!tag}>
            すべて
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/photos?tag=${encodeURIComponent(t)}`}
              className="tag"
              aria-pressed={tag === t}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <PhotoGallery
          key={tag ?? "all"}
          initialItems={items}
          initialCursor={nextCursor}
          tag={tag}
        />
      ) : (
        <p className="muted">写真がありません。</p>
      )}
    </main>
  );
}

import { PhotoGallery } from "@/components/photo-gallery";
import { TagFilter } from "@/components/tag-filter";
import { getPhotos, getPhotoTags } from "@/lib/api";
import { PHOTOS_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos" };

export default async function Photos({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const [{ items, nextCursor }, tags] = await Promise.all([
    getPhotos({ category, tag, limit: PHOTOS_PAGE_SIZE }),
    getPhotoTags(),
  ]);

  return (
    <main className="section container container-wide">
      <div className="section__head">
        <span className="eyebrow">Gallery</span>
        <h2>写真</h2>
      </div>

      <TagFilter
        categories={tags}
        pathname="/photos"
        categoryName={category}
        tagName={tag}
      />

      {items.length > 0 ? (
        <PhotoGallery
          key={`${category ?? "all"}-${tag ?? "all"}`}
          initialItems={items}
          initialCursor={nextCursor}
          category={category}
          tag={tag}
        />
      ) : (
        <p className="muted">写真がありません。</p>
      )}
    </main>
  );
}

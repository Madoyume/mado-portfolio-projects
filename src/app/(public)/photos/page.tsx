import { PhotoGallery } from "@/components/photo-gallery";
import { TagFilter } from "@/components/tag-filter";
import { getPhotos, getPhotoTags } from "@/lib/api";
import { PHOTOS_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos" };

export default async function Photos({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; tagId?: string }>;
}) {
  const { categoryId, tagId } = await searchParams;
  const [{ items, nextCursor }, tags] = await Promise.all([
    getPhotos({ categoryId, tagId, limit: PHOTOS_PAGE_SIZE }),
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
        categoryId={categoryId}
        tagId={tagId}
      />

      {items.length > 0 ? (
        <PhotoGallery
          key={`${categoryId ?? "all"}-${tagId ?? "all"}`}
          initialItems={items}
          initialCursor={nextCursor}
          categoryId={categoryId}
          tagId={tagId}
        />
      ) : (
        <p className="muted">写真がありません。</p>
      )}
    </main>
  );
}

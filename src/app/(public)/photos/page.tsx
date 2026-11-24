import { MonthArchive } from "@/components/month-archive";
import { PhotoGallery } from "@/components/photo-gallery";
import { TagFilter } from "@/components/tag-filter";
import { getPhotoArchive, getPhotos, getPhotoTags } from "@/lib/api";
import { PHOTOS_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos" };

export default async function Photos({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; month?: string }>;
}) {
  const { category, tag, month } = await searchParams;
  const [{ items, nextCursor }, tags, archive] = await Promise.all([
    getPhotos({ category, tag, month, limit: PHOTOS_PAGE_SIZE }),
    getPhotoTags(),
    getPhotoArchive(),
  ]);

  return (
    <main className="container container-wide photos-layout">
      <aside className="photos-side">
        <MonthArchive pathname="/photos" months={archive} active={month} />
      </aside>
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Gallery</span>
          <h2>写真</h2>
        </div>

        <TagFilter
          categories={tags}
          pathname="/photos"
          categoryName={category}
          tagName={tag}
          month={month}
        />

        {items.length > 0 ? (
          <PhotoGallery
            key={`${category ?? "all"}-${tag ?? "all"}-${month ?? "all"}`}
            initialItems={items}
            initialCursor={nextCursor}
            category={category}
            tag={tag}
            month={month}
          />
        ) : (
          <p className="muted">写真がありません。</p>
        )}
      </section>
    </main>
  );
}

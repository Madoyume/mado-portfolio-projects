import { PhotoGallery } from "@/components/photo-gallery";
import { getPhotos } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = { title: "Photos" };

export default async function Photos() {
  const photos = await getPhotos();

  return (
    <main className="section container container-wide">
      <div className="section__head">
        <span className="eyebrow">Gallery</span>
        <h2>写真</h2>
      </div>
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} />
      ) : (
        <p className="muted">写真がありません。</p>
      )}
    </main>
  );
}

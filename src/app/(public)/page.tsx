import Link from "next/link";
import { HeroCarousel } from "@/components/hero-carousel";
import { getPhotos, getPosts, getProfile } from "@/lib/api";
import { HOME_FEATURED_LIMIT } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, photos, posts] = await Promise.all([
    getProfile(),
    getPhotos({ limit: HOME_FEATURED_LIMIT }),
    getPosts({ limit: HOME_FEATURED_LIMIT }),
  ]);
  const topPhotos = photos.items;
  const latest = posts.items;

  return (
    <main>
      <HeroCarousel
        images={profile?.heroImages ?? []}
        name={profile?.name ?? "Mado"}
        headline={profile?.headline ?? "Web Engineer"}
      />

      <hr className="divider container" />

      <section className="section container container-wide">
        <div className="section__head">
          <span className="eyebrow">Selected Works</span>
          <h2>写真</h2>
        </div>
        <div className="photo-strip">
          {topPhotos.map((photo) => (
            <figure key={photo.id}>
              {photo.url ? (
                <img src={photo.url} alt={photo.title ?? ""} loading="lazy" />
              ) : (
                <div className="photo-placeholder" />
              )}
            </figure>
          ))}
        </div>
        <Link href="/photos" className="section__more">
          ギャラリーを見る →
        </Link>
      </section>

      <section className="section container">
        <div className="section__head">
          <span className="eyebrow">Writing</span>
          <h2>最新の記事</h2>
        </div>
        <div className="blog-list">
          {latest.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              className="post-row"
              key={post.id}
            >
              <time dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <div>
                <h3>{post.title}</h3>
                {post.description && <p>{post.description}</p>}
              </div>
            </Link>
          ))}
        </div>
        <Link href="/blog" className="section__more">
          ブログへ →
        </Link>
      </section>
    </main>
  );
}

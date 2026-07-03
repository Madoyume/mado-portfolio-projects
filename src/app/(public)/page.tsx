import Link from "next/link";
import { getPhotos, getPosts, getProfile } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, photos, posts] = await Promise.all([
    getProfile(),
    getPhotos({ limit: 3 }),
    getPosts({ limit: 3 }),
  ]);
  const topPhotos = photos.items;
  const latest = posts.items;

  return (
    <main>
      <section className="hero">
        {profile?.heroImageUrl && (
          <img className="hero__img" src={profile.heroImageUrl} alt="" />
        )}
        <div className="hero__inner fade">
          <h1 className="hero__name">{profile?.name ?? "Mado"}</h1>
          <p className="hero__role">{profile?.headline ?? "Web Engineer"}</p>
        </div>
      </section>

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
            <article className="post-row" key={post.id}>
              <time dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <div>
                <h3>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                {post.description && <p>{post.description}</p>}
              </div>
            </article>
          ))}
        </div>
        <Link href="/blog" className="section__more">
          ブログへ →
        </Link>
      </section>
    </main>
  );
}

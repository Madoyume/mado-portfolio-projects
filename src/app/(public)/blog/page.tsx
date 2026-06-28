import Link from "next/link";
import { getPosts } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const { items } = await getPosts();
  const tags = [...new Set(items.flatMap((item) => item.tags ?? []))];
  const filtered = tag
    ? items.filter((item) => item.tags?.includes(tag))
    : items;

  return (
    <main className="container">
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Writing</span>
          <h2>ブログ</h2>
        </div>

        {tags.length > 0 && (
          <div className="filters">
            <Link href="/blog" className="tag" aria-pressed={!tag}>
              すべて
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="tag"
                aria-pressed={tag === t}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        <div className="blog-list">
          {filtered.map((post) => (
            <article className="post-row" key={post.id}>
              <time dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <div>
                <h3>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                {post.description && <p>{post.description}</p>}
                {post.tags && post.tags.length > 0 && (
                  <div className="tags">
                    {post.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && <p className="muted">記事がありません。</p>}
      </section>
    </main>
  );
}

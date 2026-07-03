import Link from "next/link";
import { BlogList } from "@/components/blog-list";
import { getBlogTags, getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [{ items, nextCursor }, tags] = await Promise.all([
    getPosts({ tag, limit: 10 }),
    getBlogTags(),
  ]);

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

        <BlogList
          key={tag ?? "all"}
          initialItems={items}
          initialCursor={nextCursor}
          tag={tag}
        />
      </section>
    </main>
  );
}

import Link from "next/link";
import { BlogArchive } from "@/components/blog-archive";
import { BlogList } from "@/components/blog-list";
import { getBlogArchive, getBlogTags, getPosts } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; month?: string }>;
}) {
  const { tag, month } = await searchParams;
  const [{ items, nextCursor }, tags, archive] = await Promise.all([
    getPosts({ tag, month, limit: BLOG_PAGE_SIZE }),
    getBlogTags(),
    getBlogArchive(),
  ]);

  return (
    <main className="container blog-layout">
      <aside className="blog-side">
        <BlogArchive months={archive} active={month} />
      </aside>
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Writing</span>
          <h2>ブログ</h2>
        </div>

        {tags.length > 0 && (
          <div className="filters">
            <Link href="/blog" className="tag" aria-pressed={!tag && !month}>
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
          key={`${tag ?? "all"}-${month ?? "all"}`}
          initialItems={items}
          initialCursor={nextCursor}
          tag={tag}
          month={month}
        />
      </section>
    </main>
  );
}

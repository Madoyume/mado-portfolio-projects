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
  searchParams: Promise<{ tag?: string; month?: string; page?: string }>;
}) {
  const { tag, month, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const [{ items, total }, tags, archive] = await Promise.all([
    getPosts({ tag, month, page, limit: BLOG_PAGE_SIZE }),
    getBlogTags(),
    getBlogArchive(),
  ]);
  const pageCount = Math.ceil(total / BLOG_PAGE_SIZE);

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
          items={items}
          page={page}
          pageCount={pageCount}
          tag={tag}
          month={month}
        />
      </section>
    </main>
  );
}

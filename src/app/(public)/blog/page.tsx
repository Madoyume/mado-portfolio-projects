import { BlogList } from "@/components/blog-list";
import { MonthArchive } from "@/components/month-archive";
import { TagFilter } from "@/components/tag-filter";
import { getBlogArchive, getBlogTags, getPosts } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    month?: string;
    page?: string;
  }>;
}) {
  const { category, tag, month, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const [{ items, total }, tags, archive] = await Promise.all([
    getPosts({ category, tag, month, page, limit: BLOG_PAGE_SIZE }),
    getBlogTags(),
    getBlogArchive(),
  ]);
  const pageCount = Math.ceil(total / BLOG_PAGE_SIZE);

  return (
    <main className="container blog-layout">
      <aside className="blog-side">
        <MonthArchive pathname="/blog" months={archive} active={month} />
      </aside>
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Writing</span>
          <h2>ブログ</h2>
        </div>

        <TagFilter
          categories={tags}
          pathname="/blog"
          categoryName={category}
          tagName={tag}
          month={month}
        />

        <BlogList
          items={items}
          page={page}
          pageCount={pageCount}
          category={category}
          tag={tag}
          month={month}
        />
      </section>
    </main>
  );
}

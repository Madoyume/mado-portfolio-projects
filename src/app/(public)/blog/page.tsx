import { BlogArchive } from "@/components/blog-archive";
import { BlogList } from "@/components/blog-list";
import { TagFilter } from "@/components/tag-filter";
import { getBlogArchive, getBlogTags, getPosts } from "@/lib/api";
import { BLOG_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    tagId?: string;
    month?: string;
    page?: string;
  }>;
}) {
  const { categoryId, tagId, month, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const [{ items, total }, tags, archive] = await Promise.all([
    getPosts({ categoryId, tagId, month, page, limit: BLOG_PAGE_SIZE }),
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

        <TagFilter
          categories={tags}
          pathname="/blog"
          categoryId={categoryId}
          tagId={tagId}
          month={month}
        />

        <BlogList
          items={items}
          page={page}
          pageCount={pageCount}
          categoryId={categoryId}
          tagId={tagId}
          month={month}
        />
      </section>
    </main>
  );
}

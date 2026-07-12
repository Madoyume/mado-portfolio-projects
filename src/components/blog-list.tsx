import type { InferResponseType } from "hono/client";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { client } from "@/lib/rpc";

type Post = InferResponseType<
  typeof client.api.blog.$get,
  200
>["items"][number];

function pageHref(page: number, tag?: string, month?: string) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (month) params.set("month", month);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export function BlogList({
  items,
  page,
  pageCount,
  tag,
  month,
}: {
  items: Post[];
  page: number;
  pageCount: number;
  tag?: string;
  month?: string;
}) {
  if (items.length === 0) {
    return <p className="muted">記事がありません。</p>;
  }

  return (
    <>
      <div className="blog-list">
        {items.map((post) => (
          <Link href={`/blog/${post.slug}`} className="post-row" key={post.id}>
            <time dateTime={post.publishedAt ?? undefined}>
              {formatDate(post.publishedAt)}
            </time>
            <div>
              <h3>{post.title}</h3>
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
          </Link>
        ))}
      </div>

      {pageCount > 1 && (
        <nav className="pagination" aria-label="ページ切り替え">
          {page > 1 && (
            <Link
              className="pagination__btn"
              href={pageHref(page - 1, tag, month)}
              aria-label="前のページ"
            >
              ‹
            </Link>
          )}
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              className="pagination__btn"
              href={pageHref(p, tag, month)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          ))}
          {page < pageCount && (
            <Link
              className="pagination__btn"
              href={pageHref(page + 1, tag, month)}
              aria-label="次のページ"
            >
              ›
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

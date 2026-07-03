"use client";

import type { InferResponseType } from "hono/client";
import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import { client } from "@/lib/rpc";

type Post = InferResponseType<
  typeof client.api.blog.$get,
  200
>["items"][number];

export function BlogList({
  initialItems,
  initialCursor,
  tag,
}: {
  initialItems: Post[];
  initialCursor: string | null;
  tag?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await client.api.blog.$get({
        query: {
          limit: "10",
          cursor,
          ...(tag ? { tag } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="muted">記事がありません。</p>;
  }

  return (
    <>
      <div className="blog-list">
        {items.map((post) => (
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

      {cursor && (
        <div className="load-more">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "読み込み中…" : "もっと見る"}
          </button>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { getPost } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description ?? undefined,
    openGraph: {
      title: post.title,
      description: post.description ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <header className="post-header container">
        {post.tags && post.tags.length > 0 && (
          <div className="tags">
            {post.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <h1>{post.title}</h1>
        <p className="muted" style={{ marginTop: "var(--space-3)" }}>
          <time dateTime={post.publishedAt ?? undefined}>
            {formatDate(post.publishedAt)}
          </time>
        </p>
      </header>

      {post.coverImageUrl && (
        <div className="container">
          <img className="post-cover" src={post.coverImageUrl} alt="" />
        </div>
      )}

      <div className="container prose">
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.body}
        </Markdown>
      </div>
    </article>
  );
}

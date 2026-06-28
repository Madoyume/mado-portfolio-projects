import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, lt, lte } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { articleListQuery } from "@/schemas/article";

export const articlesRoute = new Hono()
  .get("/", zValidator("query", articleListQuery), async (c) => {
    const { tag, limit, cursor } = c.req.valid("query");
    const now = new Date().toISOString();

    const conditions = [
      eq(articles.status, "published"),
      isNotNull(articles.publishedAt),
      lte(articles.publishedAt, now),
    ];
    if (cursor) conditions.push(lt(articles.publishedAt, cursor));

    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        description: articles.description,
        coverImageUrl: articles.coverImageUrl,
        tags: articles.tags,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit + 1);

    const filtered = tag ? rows.filter((r) => r.tags?.includes(tag)) : rows;
    const items = filtered.slice(0, limit);
    const nextCursor =
      filtered.length > limit ? (items.at(-1)?.publishedAt ?? null) : null;

    return c.json({ items, nextCursor });
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const now = new Date().toISOString();

    const [row] = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.slug, slug),
          eq(articles.status, "published"),
          isNotNull(articles.publishedAt),
          lte(articles.publishedAt, now),
        ),
      )
      .limit(1);

    if (!row) return c.json({ message: "article not found" }, 404);
    return c.json(row);
  });

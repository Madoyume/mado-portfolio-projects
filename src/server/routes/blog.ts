import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, lt, lte } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { postListQuery } from "@/schemas/post";

export const blogRoute = new Hono()
  .get("/", zValidator("query", postListQuery), async (c) => {
    const { tag, limit, cursor } = c.req.valid("query");
    const now = new Date().toISOString();

    const conditions = [
      eq(posts.status, "published"),
      isNotNull(posts.publishedAt),
      lte(posts.publishedAt, now),
    ];
    if (cursor) conditions.push(lt(posts.publishedAt, cursor));

    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        description: posts.description,
        coverImageUrl: posts.coverImageUrl,
        tags: posts.tags,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
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
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.status, "published"),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now),
        ),
      )
      .limit(1);

    if (!row) return c.json({ message: "post not found" }, 404);
    return c.json(row);
  });

import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, lt, lte } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { postInput, postListQuery } from "@/schemas/post";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

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
  .get("/admin/all", requireAuth, async (c) => {
    const rows = await db.select().from(posts).orderBy(desc(posts.updatedAt));
    return c.json(rows);
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
  })
  .post("/", requireAuth, zJson(postInput), async (c) => {
    const data = c.req.valid("json");
    try {
      const [row] = await db.insert(posts).values(data).returning();
      return c.json(row, 201);
    } catch (err) {
      if (err instanceof Error && /UNIQUE/i.test(err.message)) {
        return c.json({ message: "slug already exists" }, 409);
      }
      throw err;
    }
  })
  .put("/:slug", requireAuth, zJson(postInput), async (c) => {
    const [row] = await db
      .update(posts)
      .set(c.req.valid("json"))
      .where(eq(posts.slug, c.req.param("slug")))
      .returning();
    if (!row) return c.json({ message: "post not found" }, 404);
    return c.json(row);
  })
  .delete("/:slug", requireAuth, async (c) => {
    const [row] = await db
      .delete(posts)
      .where(eq(posts.slug, c.req.param("slug")))
      .returning();
    if (!row) return c.json({ message: "post not found" }, 404);
    return c.body(null, 204);
  });

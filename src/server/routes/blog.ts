import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { deleteImage, deleteImagesByPrefix, imageUrl } from "@/lib/cloudinary";
import { BLOG_FOLDER, POST_STATUS } from "@/lib/constants";
import { nowJst } from "@/lib/datetime";
import { stripFolder, withFolder } from "@/lib/public-id";
import { postInput, postListQuery } from "@/schemas/post";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

function withCover<T extends { coverImageId: string | null }>(row: T) {
  return {
    ...row,
    coverImageUrl: row.coverImageId
      ? imageUrl(withFolder(row.coverImageId, BLOG_FOLDER))
      : null,
  };
}

function coverToId(data: { coverImageId?: string | null }) {
  return data.coverImageId
    ? stripFolder(data.coverImageId, BLOG_FOLDER)
    : data.coverImageId;
}

export const blogRoute = new Hono()
  .get("/", zValidator("query", postListQuery), async (c) => {
    const { tag, month, limit, page } = c.req.valid("query");
    const now = nowJst();

    const conditions = [
      eq(posts.status, POST_STATUS.PUBLISHED),
      isNotNull(posts.publishedAt),
      lte(posts.publishedAt, now),
    ];
    if (month) {
      conditions.push(sql`substr(${posts.publishedAt}, 1, 7) = ${month}`);
    }
    if (tag) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM json_each(${posts.tags}) WHERE value = ${tag})`,
      );
    }
    const where = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          description: posts.description,
          tags: posts.tags,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(where)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: sql<number>`count(*)` }).from(posts).where(where),
    ]);

    return c.json({ items, total });
  })
  .get("/tags", async (c) => {
    const now = nowJst();
    const rows = await db
      .select({ tags: posts.tags })
      .from(posts)
      .where(
        and(
          eq(posts.status, POST_STATUS.PUBLISHED),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now),
        ),
      );
    const tags = new Set<string>();
    for (const row of rows) for (const t of row.tags ?? []) tags.add(t);
    return c.json([...tags].sort());
  })
  .get("/archive", async (c) => {
    const now = nowJst();
    // published_at は JST オフセット付きで保存されるため先頭7文字がそのまま JST の年月
    const month = sql<string>`substr(${posts.publishedAt}, 1, 7)`;
    const rows = await db
      .select({ month: month.as("month"), count: sql<number>`count(*)` })
      .from(posts)
      .where(
        and(
          eq(posts.status, POST_STATUS.PUBLISHED),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now),
        ),
      )
      .groupBy(month)
      .orderBy(desc(month));
    return c.json(rows);
  })
  .get("/admin/all", requireAuth, async (c) => {
    const rows = await db.select().from(posts).orderBy(desc(posts.updatedAt));
    return c.json(rows.map(withCover));
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const now = nowJst();

    const [row] = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.status, POST_STATUS.PUBLISHED),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, now),
        ),
      )
      .limit(1);

    if (!row) return c.json({ message: "post not found" }, 404);
    return c.json(withCover(row));
  })
  .post("/", requireAuth, zJson(postInput), async (c) => {
    const data = c.req.valid("json");
    try {
      const [row] = await db
        .insert(posts)
        .values({ ...data, coverImageId: coverToId(data) })
        .returning();
      return c.json(withCover(row), 201);
    } catch (err) {
      if (err instanceof Error && /UNIQUE/i.test(err.message)) {
        return c.json({ message: "slug already exists" }, 409);
      }
      throw err;
    }
  })
  .put("/:slug", requireAuth, zJson(postInput), async (c) => {
    const data = c.req.valid("json");
    const slug = c.req.param("slug");
    const [prev] = await db
      .select({ coverImageId: posts.coverImageId })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    const [row] = await db
      .update(posts)
      .set({ ...data, slug, coverImageId: coverToId(data) })
      .where(eq(posts.slug, slug))
      .returning();
    if (!row) return c.json({ message: "post not found" }, 404);
    if (prev?.coverImageId && prev.coverImageId !== row.coverImageId) {
      try {
        await deleteImage(withFolder(prev.coverImageId, BLOG_FOLDER));
      } catch {}
    }
    return c.json(withCover(row));
  })
  .delete("/:slug", requireAuth, async (c) => {
    const [row] = await db
      .delete(posts)
      .where(eq(posts.slug, c.req.param("slug")))
      .returning();
    if (!row) return c.json({ message: "post not found" }, 404);
    try {
      if (row.coverImageId) {
        await deleteImage(withFolder(row.coverImageId, BLOG_FOLDER));
      }
      await deleteImagesByPrefix(`${BLOG_FOLDER}/${row.slug}/`);
    } catch {}
    return c.body(null, 204);
  });

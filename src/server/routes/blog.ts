import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { posts, postTags } from "@/db/schema";
import { deleteImage, deleteImagesByPrefix, imageUrl } from "@/lib/cloudinary";
import { BLOG_FOLDER, POST_STATUS } from "@/lib/constants";
import { nowJst } from "@/lib/datetime";
import { stripFolder, withFolder } from "@/lib/public-id";
import { postInput, postListQuery } from "@/schemas/post";
import { requireAuth } from "@/server/middleware/auth";
import {
  getPostTagGroups,
  getPublicBlogTagCategories,
  isValidTagFilter,
  replacePostTags,
  TagInputError,
  validateTagGroups,
} from "@/server/tag-service";
import { zJson } from "@/server/validator";

async function withCover<T extends { id: string; coverImageId: string | null }>(
  row: T,
) {
  const tags = (await getPostTagGroups([row.id])).get(row.id) ?? [];
  return {
    ...row,
    tags,
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
    const { categoryId, tagId, month, limit, page } = c.req.valid("query");
    if (!(await isValidTagFilter(categoryId, tagId))) {
      return c.json({ message: "invalid tag filter" }, 422);
    }
    const now = nowJst();

    const conditions = [
      eq(posts.status, POST_STATUS.PUBLISHED),
      isNotNull(posts.publishedAt),
      lte(posts.publishedAt, now),
    ];
    if (month) {
      conditions.push(sql`substr(${posts.publishedAt}, 1, 7) = ${month}`);
    }
    if (categoryId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM post_tags pt INNER JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ${posts.id} AND t.category_id = ${categoryId})`,
      );
    }
    if (tagId)
      conditions.push(
        sql`EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = ${posts.id} AND pt.tag_id = ${tagId})`,
      );
    const where = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          description: posts.description,
          coverImageId: posts.coverImageId,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(where)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: sql<number>`count(*)` }).from(posts).where(where),
    ]);

    return c.json({ items: await Promise.all(items.map(withCover)), total });
  })
  .get("/tags", async (c) => {
    return c.json(await getPublicBlogTagCategories());
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
    return c.json(await Promise.all(rows.map(withCover)));
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
    return c.json(await withCover(row));
  })
  .post("/", requireAuth, zJson(postInput), async (c) => {
    const data = c.req.valid("json");
    try {
      const { tagGroups, ...values } = data;
      await validateTagGroups(tagGroups);
      const [row] = await db
        .insert(posts)
        .values({ ...values, coverImageId: coverToId(values) })
        .returning();
      await replacePostTags(row.id, tagGroups);
      return c.json(await withCover(row), 201);
    } catch (err) {
      if (err instanceof TagInputError) {
        return c.json({ message: err.message }, 422);
      }
      const cause =
        err instanceof Error && err.cause instanceof Error ? err.cause : err;
      if (cause instanceof Error && /UNIQUE/i.test(cause.message)) {
        return c.json({ message: "slug already exists" }, 409);
      }
      throw err;
    }
  })
  .put("/:slug", requireAuth, zJson(postInput), async (c) => {
    const data = c.req.valid("json");
    const { tagGroups, ...values } = data;
    try {
      await validateTagGroups(tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    const slug = c.req.param("slug");
    const [prev] = await db
      .select({ coverImageId: posts.coverImageId })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    const [row] = await db
      .update(posts)
      .set({ ...values, slug, coverImageId: coverToId(values) })
      .where(eq(posts.slug, slug))
      .returning();
    if (!row) return c.json({ message: "post not found" }, 404);
    try {
      await replacePostTags(row.id, tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    if (prev?.coverImageId && prev.coverImageId !== row.coverImageId) {
      try {
        await deleteImage(withFolder(prev.coverImageId, BLOG_FOLDER));
      } catch {}
    }
    return c.json(await withCover(row));
  })
  .delete("/:slug", requireAuth, async (c) => {
    const [row] = await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(posts)
        .where(eq(posts.slug, c.req.param("slug")))
        .returning();
      if (deleted)
        await tx.delete(postTags).where(eq(postTags.postId, deleted.id));
      return [deleted];
    });
    if (!row) return c.json({ message: "post not found" }, 404);
    try {
      if (row.coverImageId) {
        await deleteImage(withFolder(row.coverImageId, BLOG_FOLDER));
      }
      await deleteImagesByPrefix(`${BLOG_FOLDER}/${row.slug}/`);
    } catch {}
    return c.body(null, 204);
  });

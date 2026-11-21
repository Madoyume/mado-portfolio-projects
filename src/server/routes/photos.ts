import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photos, photoTags } from "@/db/schema";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import { PHOTOS_FOLDER } from "@/lib/constants";
import { stripFolder, withFolder } from "@/lib/public-id";
import {
  photoCreateInput,
  photoListQuery,
  photoMetaInput,
} from "@/schemas/photo";
import { requireAuth } from "@/server/middleware/auth";
import {
  getPhotoTagGroups,
  getPublicPhotoTagCategories,
  isValidTagFilter,
  replacePhotoTags,
  TagInputError,
  validateTagGroups,
} from "@/server/tag-service";
import { zJson } from "@/server/validator";

const sortKey = sql`coalesce(${photos.takenAt}, ${photos.createdAt})`;

async function withTags<T extends { id: string }>(row: T) {
  const tags = (await getPhotoTagGroups([row.id])).get(row.id) ?? [];
  return { ...row, tags };
}

export const photosRoute = new Hono()
  .get("/", zValidator("query", photoListQuery), async (c) => {
    const { categoryId, tagId, limit, cursor } = c.req.valid("query");
    if (!(await isValidTagFilter(categoryId, tagId))) {
      return c.json({ message: "invalid tag filter" }, 422);
    }
    const conditions = [];
    if (cursor) conditions.push(sql`${sortKey} < ${cursor}`);
    if (categoryId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM photo_tags pt INNER JOIN tags t ON t.id = pt.tag_id WHERE pt.photo_id = ${photos.id} AND t.category_id = ${categoryId})`,
      );
    }
    if (tagId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM photo_tags pt WHERE pt.photo_id = ${photos.id} AND pt.tag_id = ${tagId})`,
      );
    }

    const rows = await db
      .select()
      .from(photos)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(sortKey), desc(photos.id))
      .limit(limit + 1);
    const items = await Promise.all(
      rows.slice(0, limit).map((row) =>
        withTags({
          ...row,
          url: imageUrl(withFolder(row.cloudinaryPublicId, PHOTOS_FOLDER)),
        }),
      ),
    );
    const last = rows[limit - 1];
    const nextCursor =
      rows.length > limit ? (last?.takenAt ?? last?.createdAt ?? null) : null;
    return c.json({ items, nextCursor });
  })
  .get("/tags", async (c) => c.json(await getPublicPhotoTagCategories()))
  .get("/admin/all", requireAuth, async (c) => {
    const rows = await db
      .select()
      .from(photos)
      .orderBy(desc(sortKey), desc(photos.id));
    const items = await Promise.all(
      rows.map((row) =>
        withTags({
          ...row,
          url: imageUrl(withFolder(row.cloudinaryPublicId, PHOTOS_FOLDER)),
        }),
      ),
    );
    return c.json(items);
  })
  .post("/", requireAuth, zJson(photoCreateInput), async (c) => {
    const { tagGroups, ...input } = c.req.valid("json");
    try {
      await validateTagGroups(tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    const [row] = await db
      .insert(photos)
      .values({
        ...input,
        cloudinaryPublicId: stripFolder(
          input.cloudinaryPublicId,
          PHOTOS_FOLDER,
        ),
      })
      .returning();
    try {
      await replacePhotoTags(row.id, tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    return c.json(
      await withTags({
        ...row,
        url: imageUrl(withFolder(row.cloudinaryPublicId, PHOTOS_FOLDER)),
      }),
      201,
    );
  })
  .put("/:id", requireAuth, zJson(photoMetaInput), async (c) => {
    const { tagGroups, ...data } = c.req.valid("json");
    try {
      await validateTagGroups(tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    const [row] = await db
      .update(photos)
      .set(data)
      .where(eq(photos.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "photo not found" }, 404);
    try {
      await replacePhotoTags(row.id, tagGroups);
    } catch (err) {
      if (err instanceof TagInputError)
        return c.json({ message: err.message }, 422);
      throw err;
    }
    return c.json(
      await withTags({
        ...row,
        url: imageUrl(withFolder(row.cloudinaryPublicId, PHOTOS_FOLDER)),
      }),
    );
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(photos)
        .where(eq(photos.id, c.req.param("id")))
        .returning();
      if (deleted)
        await tx.delete(photoTags).where(eq(photoTags.photoId, deleted.id));
      return [deleted];
    });
    if (!row) return c.json({ message: "photo not found" }, 404);
    try {
      await deleteImage(withFolder(row.cloudinaryPublicId, PHOTOS_FOLDER));
    } catch {}
    return c.body(null, 204);
  });

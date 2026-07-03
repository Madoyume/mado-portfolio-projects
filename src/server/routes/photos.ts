import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photos } from "@/db/schema";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import {
  photoCreateInput,
  photoListQuery,
  photoMetaInput,
} from "@/schemas/photo";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

const sortKey = sql`coalesce(${photos.takenAt}, ${photos.createdAt})`;

export const photosRoute = new Hono()
  .get("/", zValidator("query", photoListQuery), async (c) => {
    const { tag, limit, cursor } = c.req.valid("query");

    const conditions = [];
    if (cursor) conditions.push(sql`${sortKey} < ${cursor}`);
    if (tag) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM json_each(${photos.tags}) WHERE value = ${tag})`,
      );
    }

    const rows = await db
      .select()
      .from(photos)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(sortKey), desc(photos.id))
      .limit(limit + 1);

    const items = rows.slice(0, limit).map((r) => ({
      ...r,
      url: imageUrl(r.cloudinaryPublicId),
    }));
    const last = rows[limit - 1];
    const nextCursor =
      rows.length > limit ? (last?.takenAt ?? last?.createdAt ?? null) : null;

    return c.json({ items, nextCursor });
  })
  .get("/tags", async (c) => {
    const rows = await db
      .select({ tags: photos.tags })
      .from(photos)
      .where(isNotNull(photos.tags));
    const tags = new Set<string>();
    for (const row of rows) for (const t of row.tags ?? []) tags.add(t);
    return c.json([...tags].sort());
  })
  .get("/admin/all", requireAuth, async (c) => {
    const rows = await db
      .select()
      .from(photos)
      .orderBy(desc(sortKey), desc(photos.id));
    const items = rows.map((r) => ({
      ...r,
      url: imageUrl(r.cloudinaryPublicId),
    }));
    return c.json(items);
  })
  .post("/", requireAuth, zJson(photoCreateInput), async (c) => {
    const [row] = await db
      .insert(photos)
      .values(c.req.valid("json"))
      .returning();
    return c.json({ ...row, url: imageUrl(row.cloudinaryPublicId) }, 201);
  })
  .put("/:id", requireAuth, zJson(photoMetaInput), async (c) => {
    const data = c.req.valid("json");
    if (Object.keys(data).length === 0) {
      return c.json({ message: "no fields to update" }, 422);
    }
    const [row] = await db
      .update(photos)
      .set(data)
      .where(eq(photos.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "photo not found" }, 404);
    return c.json({ ...row, url: imageUrl(row.cloudinaryPublicId) });
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db
      .delete(photos)
      .where(eq(photos.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "photo not found" }, 404);
    try {
      await deleteImage(row.cloudinaryPublicId);
    } catch {}
    return c.body(null, 204);
  });

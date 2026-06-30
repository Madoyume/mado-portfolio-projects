import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photos } from "@/db/schema";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import { photoCreateInput, photoMetaInput } from "@/schemas/photo";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

export const photosRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(photos).orderBy(photos.sortOrder);
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

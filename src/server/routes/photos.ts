import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photos } from "@/db/schema";
import { photoMetaInput } from "@/schemas/photo";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

export const photosRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(photos).orderBy(photos.sortOrder);
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const items = rows.map((r) => ({
      ...r,
      url: cloud
        ? `https://res.cloudinary.com/${cloud}/image/upload/${r.cloudinaryPublicId}`
        : null,
    }));
    return c.json(items);
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
    return c.json(row);
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db
      .delete(photos)
      .where(eq(photos.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "photo not found" }, 404);
    return c.body(null, 204);
  });

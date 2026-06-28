import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photos } from "@/db/schema";
import { deleteImage, imageUrl, uploadImage } from "@/lib/cloudinary";
import { photoMetaInput } from "@/schemas/photo";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

function field(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? value : null;
}

export const photosRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(photos).orderBy(photos.sortOrder);
    const items = rows.map((r) => ({
      ...r,
      url: imageUrl(r.cloudinaryPublicId),
    }));
    return c.json(items);
  })
  .post("/", requireAuth, async (c) => {
    const body = await c.req.formData();
    const file = body.get("file");
    if (!(file instanceof File)) {
      return c.json({ message: "file is required" }, 422);
    }
    const uploaded = await uploadImage(file, { folder: "mado/photos" });
    const [row] = await db
      .insert(photos)
      .values({
        cloudinaryPublicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        title: field(body.get("title")),
        description: field(body.get("description")),
        takenAt: field(body.get("takenAt")),
      })
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

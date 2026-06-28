import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { profile } from "@/db/schema";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { profileInput } from "@/schemas/profile";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

const HERO_PUBLIC_ID = "mado/hero";
const AVATAR_PUBLIC_ID = "mado/avatar";

export const profileRoute = new Hono()
  .get("/", async (c) => {
    const [row] = await db
      .select()
      .from(profile)
      .where(eq(profile.id, "default"))
      .limit(1);
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(row);
  })
  .put("/", requireAuth, zJson(profileInput), async (c) => {
    const data = c.req.valid("json");
    const [updated] = await db
      .update(profile)
      .set(data)
      .where(eq(profile.id, "default"))
      .returning();
    if (updated) return c.json(updated);
    const [created] = await db
      .insert(profile)
      .values({ ...data, id: "default" })
      .returning();
    return c.json(created);
  })
  .post("/hero-image", requireAuth, async (c) => {
    const body = await c.req.formData();
    const file = body.get("file");
    if (!(file instanceof File)) {
      return c.json({ message: "file is required" }, 422);
    }
    const uploaded = await uploadImage(file, {
      publicId: HERO_PUBLIC_ID,
      overwrite: true,
    });
    const [row] = await db
      .update(profile)
      .set({ heroImageUrl: uploaded.url })
      .where(eq(profile.id, "default"))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(row);
  })
  .delete("/hero-image", requireAuth, async (c) => {
    try {
      await deleteImage(HERO_PUBLIC_ID);
    } catch {}
    const [row] = await db
      .update(profile)
      .set({ heroImageUrl: null })
      .where(eq(profile.id, "default"))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(row);
  })
  .post("/avatar", requireAuth, async (c) => {
    const body = await c.req.formData();
    const file = body.get("file");
    if (!(file instanceof File)) {
      return c.json({ message: "file is required" }, 422);
    }
    const uploaded = await uploadImage(file, {
      publicId: AVATAR_PUBLIC_ID,
      overwrite: true,
    });
    const [row] = await db
      .update(profile)
      .set({ avatarUrl: uploaded.url })
      .where(eq(profile.id, "default"))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(row);
  })
  .delete("/avatar", requireAuth, async (c) => {
    try {
      await deleteImage(AVATAR_PUBLIC_ID);
    } catch {}
    const [row] = await db
      .update(profile)
      .set({ avatarUrl: null })
      .where(eq(profile.id, "default"))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(row);
  })
  .post("/social-icon", requireAuth, async (c) => {
    const body = await c.req.formData();
    const file = body.get("file");
    if (!(file instanceof File)) {
      return c.json({ message: "file is required" }, 422);
    }
    const uploaded = await uploadImage(file, { folder: "mado/social" });
    return c.json({ iconUrl: uploaded.url }, 201);
  });

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { profile } from "@/db/schema";
import { deleteImage } from "@/lib/cloudinary";
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
  });

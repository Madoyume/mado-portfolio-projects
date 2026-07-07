import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { z } from "zod";
import { db } from "@/db/client";
import { profile } from "@/db/schema";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import {
  AVATAR_PUBLIC_ID,
  HERO_PUBLIC_ID,
  PROFILE_ID,
  SOCIAL_FOLDER,
} from "@/lib/constants";
import { stripFolder, withFolder } from "@/lib/public-id";
import { profileInput } from "@/schemas/profile";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

type ProfileRow = typeof profile.$inferSelect;
type SocialLinkInput = NonNullable<
  z.infer<typeof profileInput>["socialLinks"]
>[number];

function withImages(row: ProfileRow) {
  return {
    ...row,
    avatarUrl: row.hasAvatar ? imageUrl(AVATAR_PUBLIC_ID) : null,
    heroImageUrl: row.hasHero ? imageUrl(HERO_PUBLIC_ID) : null,
    socialLinks: (row.socialLinks ?? []).map((l) => ({
      ...l,
      iconUrl: l.iconId ? imageUrl(withFolder(l.iconId, SOCIAL_FOLDER)) : null,
      iconUrlDark: l.iconIdDark
        ? imageUrl(withFolder(l.iconIdDark, SOCIAL_FOLDER))
        : null,
    })),
  };
}

function socialLinksToIds(links?: SocialLinkInput[] | null) {
  return links?.map((l) => ({
    ...l,
    iconId: l.iconId ? stripFolder(l.iconId, SOCIAL_FOLDER) : l.iconId,
    iconIdDark: l.iconIdDark
      ? stripFolder(l.iconIdDark, SOCIAL_FOLDER)
      : l.iconIdDark,
  }));
}

export const profileRoute = new Hono()
  .get("/", async (c) => {
    const [row] = await db
      .select()
      .from(profile)
      .where(eq(profile.id, PROFILE_ID))
      .limit(1);
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  })
  .put("/", requireAuth, zJson(profileInput), async (c) => {
    const data = c.req.valid("json");
    const values = { ...data, socialLinks: socialLinksToIds(data.socialLinks) };
    const [updated] = await db
      .update(profile)
      .set(values)
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (updated) return c.json(withImages(updated));
    const [created] = await db
      .insert(profile)
      .values({ ...values, id: PROFILE_ID })
      .returning();
    return c.json(withImages(created));
  })
  .post("/hero-image", requireAuth, async (c) => {
    const [row] = await db
      .update(profile)
      .set({ hasHero: true })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  })
  .delete("/hero-image", requireAuth, async (c) => {
    try {
      await deleteImage(HERO_PUBLIC_ID);
    } catch {}
    const [row] = await db
      .update(profile)
      .set({ hasHero: false })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  })
  .post("/avatar", requireAuth, async (c) => {
    const [row] = await db
      .update(profile)
      .set({ hasAvatar: true })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  })
  .delete("/avatar", requireAuth, async (c) => {
    try {
      await deleteImage(AVATAR_PUBLIC_ID);
    } catch {}
    const [row] = await db
      .update(profile)
      .set({ hasAvatar: false })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  });

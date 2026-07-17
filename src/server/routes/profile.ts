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
import { imageVersionInput, profileInput } from "@/schemas/profile";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

type ProfileRow = typeof profile.$inferSelect;
type SocialLinkInput = NonNullable<
  z.infer<typeof profileInput>["socialLinks"]
>[number];

function withImages(row: ProfileRow) {
  return {
    ...row,
    avatarUrl: row.avatarVersion
      ? imageUrl(AVATAR_PUBLIC_ID, row.avatarVersion)
      : null,
    heroImageUrl: row.heroVersion
      ? imageUrl(HERO_PUBLIC_ID, row.heroVersion)
      : null,
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

type IconLink = { iconId?: string | null; iconIdDark?: string | null };

function iconIds(links?: IconLink[] | null) {
  return new Set(
    (links ?? [])
      .flatMap((l) => [l.iconId, l.iconIdDark])
      .filter((id): id is string => !!id),
  );
}

async function deleteRemovedIcons(
  prev?: IconLink[] | null,
  next?: IconLink[] | null,
) {
  const kept = iconIds(next);
  for (const id of iconIds(prev)) {
    if (kept.has(id)) continue;
    try {
      await deleteImage(withFolder(id, SOCIAL_FOLDER));
    } catch {}
  }
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
    const [prev] = await db
      .select({ socialLinks: profile.socialLinks })
      .from(profile)
      .where(eq(profile.id, PROFILE_ID))
      .limit(1);
    const [updated] = await db
      .update(profile)
      .set(values)
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    const row =
      updated ??
      (
        await db
          .insert(profile)
          .values({ ...values, id: PROFILE_ID })
          .returning()
      )[0];
    await deleteRemovedIcons(prev?.socialLinks, values.socialLinks);
    return c.json(withImages(row));
  })
  .post("/hero-image", requireAuth, zJson(imageVersionInput), async (c) => {
    const { version } = c.req.valid("json");
    const [row] = await db
      .update(profile)
      .set({ heroVersion: version })
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
      .set({ heroVersion: null })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  })
  .post("/avatar", requireAuth, zJson(imageVersionInput), async (c) => {
    const { version } = c.req.valid("json");
    const [row] = await db
      .update(profile)
      .set({ avatarVersion: version })
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
      .set({ avatarVersion: null })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(withImages(row));
  });

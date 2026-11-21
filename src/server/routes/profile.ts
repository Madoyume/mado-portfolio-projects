import { asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { z } from "zod";
import { db } from "@/db/client";
import { heroImages, profile } from "@/db/schema";
import { deleteImage, imageUrl } from "@/lib/cloudinary";
import {
  AVATAR_PUBLIC_ID,
  CLOUDINARY_ROOT,
  HERO_FOLDER,
  PROFILE_ID,
  SOCIAL_FOLDER,
} from "@/lib/constants";
import { stripFolder, withFolder } from "@/lib/public-id";
import {
  heroImageInput,
  heroImageOrderInput,
  imageVersionInput,
  profileInput,
} from "@/schemas/profile";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

type ProfileRow = typeof profile.$inferSelect;
type SocialLinkInput = NonNullable<
  z.infer<typeof profileInput>["socialLinks"]
>[number];

async function getHeroImages() {
  const rows = await db
    .select()
    .from(heroImages)
    .orderBy(asc(heroImages.sortOrder), asc(heroImages.createdAt));
  return rows.map((row) => ({
    id: row.id,
    url: imageUrl(
      withFolder(row.cloudinaryPublicId, CLOUDINARY_ROOT),
      row.version,
    ),
  }));
}

async function withImages(row: ProfileRow) {
  return {
    ...row,
    avatarUrl: row.avatarVersion
      ? imageUrl(AVATAR_PUBLIC_ID, row.avatarVersion)
      : null,
    heroImages: await getHeroImages(),
    socialLinks: (row.socialLinks ?? []).map((link) => ({
      ...link,
      iconUrl: link.iconId
        ? imageUrl(withFolder(link.iconId, SOCIAL_FOLDER))
        : null,
      iconUrlDark: link.iconIdDark
        ? imageUrl(withFolder(link.iconIdDark, SOCIAL_FOLDER))
        : null,
    })),
  };
}

function socialLinksToIds(links?: SocialLinkInput[] | null) {
  return links?.map((link) => ({
    ...link,
    iconId: link.iconId ? stripFolder(link.iconId, SOCIAL_FOLDER) : link.iconId,
    iconIdDark: link.iconIdDark
      ? stripFolder(link.iconIdDark, SOCIAL_FOLDER)
      : link.iconIdDark,
  }));
}

type IconLink = { iconId?: string | null; iconIdDark?: string | null };

function iconIds(links?: IconLink[] | null) {
  return new Set(
    (links ?? [])
      .flatMap((link) => [link.iconId, link.iconIdDark])
      .filter((id): id is string => !!id),
  );
}

async function deleteRemovedIcons(
  previous?: IconLink[] | null,
  next?: IconLink[] | null,
) {
  const kept = iconIds(next);
  for (const id of iconIds(previous)) {
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
    return c.json(await withImages(row));
  })
  .put("/", requireAuth, zJson(profileInput), async (c) => {
    const data = c.req.valid("json");
    const values = { ...data, socialLinks: socialLinksToIds(data.socialLinks) };
    const [previous] = await db
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
    await deleteRemovedIcons(previous?.socialLinks, values.socialLinks);
    return c.json(await withImages(row));
  })
  .post("/hero-images", requireAuth, zJson(heroImageInput), async (c) => {
    const input = c.req.valid("json");
    if (!input.publicId.startsWith(`${HERO_FOLDER}/`)) {
      return c.json({ message: "invalid hero image" }, 422);
    }
    const cloudinaryPublicId = stripFolder(input.publicId, CLOUDINARY_ROOT);
    const [last] = await db
      .select({ sortOrder: heroImages.sortOrder })
      .from(heroImages)
      .orderBy(desc(heroImages.sortOrder));
    const [row] = await db
      .insert(heroImages)
      .values({
        cloudinaryPublicId,
        version: input.version,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      })
      .returning();
    return c.json(
      {
        id: row.id,
        url: imageUrl(
          withFolder(row.cloudinaryPublicId, CLOUDINARY_ROOT),
          row.version,
        ),
      },
      201,
    );
  })
  .put(
    "/hero-images/order",
    requireAuth,
    zJson(heroImageOrderInput),
    async (c) => {
      const { ids } = c.req.valid("json");
      const rows = await db.select({ id: heroImages.id }).from(heroImages);
      if (rows.length !== ids.length || new Set(ids).size !== ids.length) {
        return c.json({ message: "invalid hero image order" }, 422);
      }
      const known = new Set(rows.map((row) => row.id));
      if (ids.some((id) => !known.has(id))) {
        return c.json({ message: "invalid hero image order" }, 422);
      }
      await db.transaction(async (tx) => {
        await Promise.all(
          ids.map((id, sortOrder) =>
            tx
              .update(heroImages)
              .set({ sortOrder })
              .where(eq(heroImages.id, id)),
          ),
        );
      });
      return c.json(await getHeroImages());
    },
  )
  .delete("/hero-images/:id", requireAuth, async (c) => {
    const [row] = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.id, c.req.param("id")))
      .limit(1);
    if (!row) return c.json({ message: "hero image not found" }, 404);
    try {
      await deleteImage(withFolder(row.cloudinaryPublicId, CLOUDINARY_ROOT));
    } catch {
      return c.json({ message: "failed to delete hero image" }, 502);
    }
    await db.delete(heroImages).where(eq(heroImages.id, row.id));
    return c.body(null, 204);
  })
  .post("/avatar", requireAuth, zJson(imageVersionInput), async (c) => {
    const { version } = c.req.valid("json");
    const [row] = await db
      .update(profile)
      .set({ avatarVersion: version })
      .where(eq(profile.id, PROFILE_ID))
      .returning();
    if (!row) return c.json({ message: "profile not found" }, 404);
    return c.json(await withImages(row));
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
    return c.json(await withImages(row));
  });

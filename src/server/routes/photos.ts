import { Hono } from "hono";
import { db } from "@/db/client";
import { photos } from "@/db/schema";

export const photosRoute = new Hono().get("/", async (c) => {
  const rows = await db.select().from(photos).orderBy(photos.sortOrder);
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const items = rows.map((r) => ({
    ...r,
    url: cloud
      ? `https://res.cloudinary.com/${cloud}/image/upload/${r.cloudinaryPublicId}`
      : null,
  }));
  return c.json(items);
});

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { profile } from "@/db/schema";
import { profileInput } from "@/schemas/profile";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

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
  });

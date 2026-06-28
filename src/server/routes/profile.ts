import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { profile } from "@/db/schema";

export const profileRoute = new Hono().get("/", async (c) => {
  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.id, "default"))
    .limit(1);
  if (!row) return c.json({ message: "profile not found" }, 404);
  return c.json(row);
});

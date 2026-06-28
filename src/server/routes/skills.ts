import { Hono } from "hono";
import { db } from "@/db/client";
import { skills } from "@/db/schema";

export const skillsRoute = new Hono().get("/", async (c) => {
  const rows = await db.select().from(skills).orderBy(skills.sortOrder);
  return c.json(rows);
});

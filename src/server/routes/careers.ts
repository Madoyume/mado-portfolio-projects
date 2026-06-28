import { Hono } from "hono";
import { db } from "@/db/client";
import { careers } from "@/db/schema";

export const careersRoute = new Hono().get("/", async (c) => {
  const rows = await db.select().from(careers).orderBy(careers.sortOrder);
  return c.json(rows);
});

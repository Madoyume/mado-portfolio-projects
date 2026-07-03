import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { careers } from "@/db/schema";
import { careerInput } from "@/schemas/career";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

export const careersRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db
      .select()
      .from(careers)
      .orderBy(desc(careers.startedAt));
    return c.json(rows);
  })
  .post("/", requireAuth, zJson(careerInput), async (c) => {
    const [row] = await db
      .insert(careers)
      .values(c.req.valid("json"))
      .returning();
    return c.json(row, 201);
  })
  .put("/:id", requireAuth, zJson(careerInput), async (c) => {
    const [row] = await db
      .update(careers)
      .set(c.req.valid("json"))
      .where(eq(careers.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "career not found" }, 404);
    return c.json(row);
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db
      .delete(careers)
      .where(eq(careers.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "career not found" }, 404);
    return c.body(null, 204);
  });

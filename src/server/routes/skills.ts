import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { skills } from "@/db/schema";
import { skillInput } from "@/schemas/skill";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

export const skillsRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db
      .select()
      .from(skills)
      .orderBy(skills.category, skills.name);
    return c.json(rows);
  })
  .post("/", requireAuth, zJson(skillInput), async (c) => {
    const [row] = await db
      .insert(skills)
      .values(c.req.valid("json"))
      .returning();
    return c.json(row, 201);
  })
  .put("/:id", requireAuth, zJson(skillInput), async (c) => {
    const [row] = await db
      .update(skills)
      .set(c.req.valid("json"))
      .where(eq(skills.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "skill not found" }, 404);
    return c.json(row);
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db
      .delete(skills)
      .where(eq(skills.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "skill not found" }, 404);
    return c.body(null, 204);
  });

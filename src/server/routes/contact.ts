import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { contactMessages } from "@/db/schema";
import { decryptText, encryptText } from "@/lib/crypto";
import { contactInput } from "@/schemas/contact";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

export const contactRoute = new Hono()
  .post("/", zJson(contactInput), async (c) => {
    const { name, email, comment, website } = c.req.valid("json");
    // honeypot が埋まっていたら bot とみなし、保存せず成功を装う
    if (website) return c.json({ ok: true }, 201);
    await db.insert(contactMessages).values({
      name,
      comment,
      emailEncrypted: await encryptText(email),
    });
    return c.json({ ok: true }, 201);
  })
  .get("/admin/all", requireAuth, async (c) => {
    const rows = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
    const items = await Promise.all(
      rows.map(async ({ emailEncrypted, ...rest }) => ({
        ...rest,
        email: await decryptText(emailEncrypted),
      })),
    );
    return c.json(items);
  })
  .delete("/:id", requireAuth, async (c) => {
    const [row] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ message: "message not found" }, 404);
    return c.body(null, 204);
  });

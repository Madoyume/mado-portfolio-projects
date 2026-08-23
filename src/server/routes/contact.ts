import { desc, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { contactMessages } from "@/db/schema";
import {
  CONTACT_RATE_DAY_MINUTES,
  CONTACT_RATE_MAX_PER_DAY,
  CONTACT_RATE_MAX_PER_WINDOW,
  CONTACT_RATE_WINDOW_MINUTES,
} from "@/lib/constants";
import { jstMinutesAgo, nowJst } from "@/lib/datetime";
import { sendContactMail } from "@/lib/mail";
import { contactInput } from "@/schemas/contact";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

async function isRateLimited() {
  const windowStart = jstMinutesAgo(CONTACT_RATE_WINDOW_MINUTES);
  const [row] = await db
    .select({
      recent: sql<number>`sum(case when ${contactMessages.createdAt} >= ${windowStart} then 1 else 0 end)`,
      daily: sql<number>`count(*)`,
    })
    .from(contactMessages)
    .where(
      gte(contactMessages.createdAt, jstMinutesAgo(CONTACT_RATE_DAY_MINUTES)),
    );
  return (
    (row?.recent ?? 0) >= CONTACT_RATE_MAX_PER_WINDOW ||
    (row?.daily ?? 0) >= CONTACT_RATE_MAX_PER_DAY
  );
}

export const contactRoute = new Hono()
  .post("/", zJson(contactInput), async (c) => {
    const { name, email, comment, website } = c.req.valid("json");
    // honeypot が埋まっていたら bot とみなし、成功を装う
    if (website) return c.json({ ok: true }, 201);

    if (await isRateLimited()) {
      return c.json({ message: "too many requests" }, 429);
    }

    const receivedAt = nowJst();
    try {
      await sendContactMail({ name, email, comment, receivedAt });
    } catch (err) {
      console.error(err instanceof Error ? err.message : "contact mail failed");
      return c.json({ message: "failed to deliver message" }, 502);
    }

    await db
      .insert(contactMessages)
      .values({ name, comment, createdAt: receivedAt });
    return c.json({ ok: true }, 201);
  })
  .get("/admin/all", requireAuth, async (c) => {
    const items = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
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

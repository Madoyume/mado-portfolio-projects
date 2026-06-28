import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verifySession } from "@/lib/session";

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token || !(await verifySession(token))) {
    return c.json({ message: "unauthorized" }, 401);
  }
  await next();
});

import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { SESSION_COOKIE } from "@/lib/constants";
import { verifySession } from "@/lib/session";

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token || !(await verifySession(token))) {
    return c.json({ message: "unauthorized" }, 401);
  }
  await next();
});

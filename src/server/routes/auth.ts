import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { getAuthEnv } from "@/lib/env";
import { createSession, verifySession } from "@/lib/session";
import { zJson } from "@/server/validator";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7;

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const loginInput = z.object({ token: z.string().min(1) });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const authRoute = new Hono()
  .post("/login", zJson(loginInput), async (c) => {
    const { token } = c.req.valid("json");
    if (!timingSafeEqual(token, getAuthEnv().ADMIN_TOKEN)) {
      return c.json({ message: "invalid token" }, 401);
    }
    setCookie(c, COOKIE, await createSession(), {
      ...cookieOptions,
      maxAge: MAX_AGE,
    });
    return c.body(null, 204);
  })
  .post("/logout", async (c) => {
    deleteCookie(c, COOKIE, cookieOptions);
    return c.body(null, 204);
  })
  .get("/me", async (c) => {
    const token = getCookie(c, COOKIE);
    if (!token || !(await verifySession(token))) {
      return c.json({ authenticated: false }, 401);
    }
    return c.json({ authenticated: true });
  });

import { describe, expect, test } from "bun:test";
import { SESSION_COOKIE } from "@/lib/constants";
import { api, loginCookie } from "./helpers";

describe("POST /api/auth/login", () => {
  test("正しいトークンでセッションCookieが発行される", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      json: { token: process.env.ADMIN_TOKEN },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
  });

  test("間違ったトークンは401", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      json: { token: "wrong-token" },
    });
    expect(res.status).toBe(401);
  });

  test("トークン欠落は422", async () => {
    const res = await api("/api/auth/login", { method: "POST", json: {} });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/auth/me", () => {
  test("ログイン後のCookieで認証済みになる", async () => {
    const cookie = await loginCookie();
    const res = await api("/api/auth/me", { cookie });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ authenticated: true });
  });

  test("Cookieなしは401", async () => {
    const res = await api("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

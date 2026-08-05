import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/db/client";
import { schema } from "@/db/schema";
import { app } from "@/server/index";

export async function migrateTestDb() {
  await migrate(db, { migrationsFolder: "drizzle" });
}

export async function resetDb() {
  for (const table of Object.values(schema)) {
    await db.delete(table);
  }
}

type ApiOptions = {
  method?: string;
  json?: unknown;
  cookie?: string;
};

export function api(path: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = {};
  if (options.json !== undefined) headers["content-type"] = "application/json";
  if (options.cookie) headers.cookie = options.cookie;
  return app.request(path, {
    method: options.method ?? "GET",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
  });
}

export async function loginCookie() {
  const res = await api("/api/auth/login", {
    method: "POST",
    json: { token: process.env.ADMIN_TOKEN },
  });
  const setCookie = res.headers.get("set-cookie");
  if (res.status !== 204 || !setCookie) {
    throw new Error(`login failed: ${res.status}`);
  }
  return setCookie.split(";")[0];
}

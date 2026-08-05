import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { api, loginCookie, migrateTestDb, resetDb } from "./helpers";

let cookie: string;

beforeAll(async () => {
  await migrateTestDb();
  cookie = await loginCookie();
});

beforeEach(resetDb);

const input = { name: "TypeScript", category: "language", level: 4 };

describe("GET /api/skills", () => {
  test("空のときは空配列を返す", async () => {
    const res = await api("/api/skills");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("category, name の順でソートされる", async () => {
    for (const s of [
      { name: "Next.js", category: "framework" },
      { name: "Go", category: "language" },
      { name: "Hono", category: "framework" },
    ]) {
      await api("/api/skills", { method: "POST", json: s, cookie });
    }
    const rows = await (await api("/api/skills")).json();
    expect(rows.map((r: { name: string }) => r.name)).toEqual([
      "Hono",
      "Next.js",
      "Go",
    ]);
  });
});

describe("POST /api/skills", () => {
  test("未認証は401", async () => {
    const res = await api("/api/skills", { method: "POST", json: input });
    expect(res.status).toBe(401);
  });

  test("必須項目が欠けていると422", async () => {
    const res = await api("/api/skills", {
      method: "POST",
      json: { category: "language" },
      cookie,
    });
    expect(res.status).toBe(422);
  });

  test("認証済みなら201でIDが採番される", async () => {
    const res = await api("/api/skills", {
      method: "POST",
      json: input,
      cookie,
    });
    expect(res.status).toBe(201);
    const row = await res.json();
    expect(row.id).toBeString();
    expect(row).toMatchObject(input);
  });
});

describe("PUT /api/skills/:id", () => {
  test("既存レコードを更新できる", async () => {
    const created = await (
      await api("/api/skills", { method: "POST", json: input, cookie })
    ).json();
    const res = await api(`/api/skills/${created.id}`, {
      method: "PUT",
      json: { ...input, level: 5 },
      cookie,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).level).toBe(5);
  });

  test("存在しないIDは404", async () => {
    const res = await api("/api/skills/no-such-id", {
      method: "PUT",
      json: input,
      cookie,
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/skills/:id", () => {
  test("削除すると一覧から消え、再削除は404", async () => {
    const created = await (
      await api("/api/skills", { method: "POST", json: input, cookie })
    ).json();

    const res = await api(`/api/skills/${created.id}`, {
      method: "DELETE",
      cookie,
    });
    expect(res.status).toBe(204);
    expect(await (await api("/api/skills")).json()).toEqual([]);

    const again = await api(`/api/skills/${created.id}`, {
      method: "DELETE",
      cookie,
    });
    expect(again.status).toBe(404);
  });
});

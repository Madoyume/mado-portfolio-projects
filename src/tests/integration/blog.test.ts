import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { api, loginCookie, migrateTestDb, resetDb } from "./helpers";

let cookie: string;

beforeAll(async () => {
  await migrateTestDb();
  cookie = await loginCookie();
});

beforeEach(resetDb);

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    slug: "hello-world",
    title: "Hello World",
    body: "本文",
    status: "draft",
    publishedAt: null,
    ...overrides,
  };
}

async function createPost(overrides: Record<string, unknown> = {}) {
  const res = await api("/api/blog", {
    method: "POST",
    json: makePost(overrides),
    cookie,
  });
  expect(res.status).toBe(201);
  return res.json();
}

const PAST = "2020-01-01T00:00:00.000+09:00";
const FUTURE = "2999-01-01T00:00:00.000+09:00";

describe("公開側の記事一覧・詳細", () => {
  test("下書きは一覧に出ず、slug直接アクセスも404", async () => {
    await createPost({ status: "draft" });
    const list = await (await api("/api/blog")).json();
    expect(list).toEqual({ items: [], total: 0 });
    expect((await api("/api/blog/hello-world")).status).toBe(404);
  });

  test("公開日が過去のpublished記事は一覧・詳細に出る", async () => {
    await createPost({ status: "published", publishedAt: PAST });
    const list = await (await api("/api/blog")).json();
    expect(list.total).toBe(1);
    expect(list.items[0].slug).toBe("hello-world");
    expect((await api("/api/blog/hello-world")).status).toBe(200);
  });

  test("公開日が未来（予約公開）の記事は公開側に出ない", async () => {
    await createPost({ status: "published", publishedAt: FUTURE });
    const list = await (await api("/api/blog")).json();
    expect(list).toEqual({ items: [], total: 0 });
    expect((await api("/api/blog/hello-world")).status).toBe(404);
  });
});

describe("POST /api/blog", () => {
  test("未認証は401", async () => {
    const res = await api("/api/blog", { method: "POST", json: makePost() });
    expect(res.status).toBe(401);
  });

  test("slug形式が不正なら422", async () => {
    const res = await api("/api/blog", {
      method: "POST",
      json: makePost({ slug: "不正な slug!" }),
      cookie,
    });
    expect(res.status).toBe(422);
  });

  test("slugが重複すると409", async () => {
    await createPost();
    const res = await api("/api/blog", {
      method: "POST",
      json: makePost(),
      cookie,
    });
    expect(res.status).toBe(409);
  });
});

describe("GET /api/blog/admin/all", () => {
  test("未認証は401", async () => {
    expect((await api("/api/blog/admin/all")).status).toBe(401);
  });

  test("認証済みなら下書きも含め全件取得できる", async () => {
    await createPost({ slug: "draft-post", status: "draft" });
    await createPost({
      slug: "published-post",
      status: "published",
      publishedAt: PAST,
    });
    const res = await api("/api/blog/admin/all", { cookie });
    expect(res.status).toBe(200);
    const rows = await res.json();
    expect(rows.map((r: { slug: string }) => r.slug).sort()).toEqual([
      "draft-post",
      "published-post",
    ]);
  });
});

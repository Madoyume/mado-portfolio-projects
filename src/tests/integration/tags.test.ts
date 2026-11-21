import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { api, loginCookie, migrateTestDb, resetDb } from "./helpers";

let cookie: string;

beforeAll(async () => {
  await migrateTestDb();
  cookie = await loginCookie();
});

beforeEach(resetDb);

async function createCategory(name = "Develop") {
  const res = await api("/api/tag-categories", {
    method: "POST",
    json: { name },
    cookie,
  });
  expect(res.status).toBe(201);
  return res.json();
}

function postInput(categoryId: string, name: string) {
  return {
    slug: `post-${name.toLowerCase()}`,
    title: name,
    body: "本文",
    status: "published",
    publishedAt: "2020-01-01T00:00:00.000+09:00",
    tagGroups: [{ categoryId, names: [name] }],
  };
}

describe("タグ分類", () => {
  test("同一親タグ内の大文字小文字差を既存タグとして再利用する", async () => {
    const category = await createCategory();
    const first = await api("/api/blog", {
      method: "POST",
      json: postInput(category.id, "TypeScript"),
      cookie,
    });
    expect(first.status).toBe(201);
    const second = await api("/api/blog", {
      method: "POST",
      json: {
        ...postInput(category.id, "typescript"),
        slug: "post-typescript-2",
      },
      cookie,
    });
    expect(second.status).toBe(201);
    const tags = await (await api("/api/blog/tags")).json();
    expect(tags).toEqual([
      {
        id: category.id,
        name: "Develop",
        tags: [expect.objectContaining({ name: "TypeScript" })],
      },
    ]);
  });

  test("親タグで公開記事を絞り込める", async () => {
    const develop = await createCategory("Develop");
    const hobby = await createCategory("Hobby");
    await api("/api/blog", {
      method: "POST",
      json: postInput(develop.id, "React"),
      cookie,
    });
    await api("/api/blog", {
      method: "POST",
      json: { ...postInput(hobby.id, "Coffee"), slug: "post-coffee" },
      cookie,
    });
    const res = await api(`/api/blog?categoryId=${develop.id}`);
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
  });

  test("子タグが残る親タグは削除できない", async () => {
    const category = await createCategory();
    await api("/api/blog", {
      method: "POST",
      json: postInput(category.id, "Hono"),
      cookie,
    });
    const res = await api(`/api/tag-categories/${category.id}`, {
      method: "DELETE",
      cookie,
    });
    expect(res.status).toBe(409);
  });

  test("異なる親タグの子タグには統合できない", async () => {
    const develop = await createCategory("Develop");
    const hobby = await createCategory("Hobby");
    await api("/api/blog", {
      method: "POST",
      json: postInput(develop.id, "Nextjs"),
      cookie,
    });
    await api("/api/blog", {
      method: "POST",
      json: { ...postInput(hobby.id, "Camera"), slug: "post-camera" },
      cookie,
    });
    const categories = await (
      await api("/api/tag-categories", { cookie })
    ).json();
    const source = categories.find(
      (category: { id: string }) => category.id === develop.id,
    ).tags[0];
    const target = categories.find(
      (category: { id: string }) => category.id === hobby.id,
    ).tags[0];
    const res = await api(`/api/tag-categories/children/${source.id}/merge`, {
      method: "POST",
      json: { targetTagId: target.id },
      cookie,
    });
    expect(res.status).toBe(422);
  });
});

import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  api,
  createCategory,
  loginCookie,
  migrateTestDb,
  resetDb,
} from "./helpers";

let cookie: string;

beforeAll(async () => {
  await migrateTestDb();
  cookie = await loginCookie();
});

beforeEach(resetDb);

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
    const category = await createCategory("Develop", cookie);
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

  test("子タグが残る親タグは削除できない", async () => {
    const category = await createCategory("Develop", cookie);
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
    const develop = await createCategory("Develop", cookie);
    const hobby = await createCategory("Hobby", cookie);
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

describe("公開記事のタグ絞り込み", () => {
  async function createPost(categoryId: string, name: string, slug: string) {
    const res = await api("/api/blog", {
      method: "POST",
      json: { ...postInput(categoryId, name), slug },
      cookie,
    });
    expect(res.status).toBe(201);
  }

  async function listSlugs(query: Record<string, string>) {
    const res = await api(`/api/blog?${new URLSearchParams(query)}`);
    expect(res.status).toBe(200);
    const { items, total } = await res.json();
    expect(total).toBe(items.length);
    return items.map((item: { slug: string }) => item.slug).sort();
  }

  beforeEach(async () => {
    const develop = await createCategory("Develop", cookie);
    const hobby = await createCategory("趣味 & 日常", cookie);
    await createPost(develop.id, "React", "develop-react");
    await createPost(develop.id, "Next.js", "develop-nextjs");
    await createPost(hobby.id, "React", "hobby-react");
    await createPost(hobby.id, "C++", "hobby-cpp");
  });

  test("指定なしなら全件を返す", async () => {
    expect(await listSlugs({})).toHaveLength(4);
  });

  test("親タグ名で絞り込める", async () => {
    expect(await listSlugs({ category: "Develop" })).toEqual([
      "develop-nextjs",
      "develop-react",
    ]);
  });

  test("親タグ名と子タグ名の双方に一致する記事だけを返す", async () => {
    expect(await listSlugs({ category: "Develop", tag: "React" })).toEqual([
      "develop-react",
    ]);
  });

  test("日本語や記号を含む名前で絞り込める", async () => {
    expect(await listSlugs({ category: "趣味 & 日常", tag: "C++" })).toEqual([
      "hobby-cpp",
    ]);
  });

  test("全角・大文字小文字・空白の違いを無視して絞り込める", async () => {
    expect(
      await listSlugs({ category: " ＤＥＶＥＬＯＰ ", tag: "NEXT.JS" }),
    ).toEqual(["develop-nextjs"]);
  });

  const invalidFilters: [string, Record<string, string>][] = [
    ["子タグのみの指定", { tag: "React" }],
    ["存在しない親タグ", { category: "Unknown" }],
    ["存在しない子タグ", { category: "Develop", tag: "Unknown" }],
    ["別の親タグに属する子タグ", { category: "Develop", tag: "C++" }],
  ];

  test.each(invalidFilters)("%sは422", async (_, query) => {
    const res = await api(`/api/blog?${new URLSearchParams(query)}`);
    expect(res.status).toBe(422);
  });
});

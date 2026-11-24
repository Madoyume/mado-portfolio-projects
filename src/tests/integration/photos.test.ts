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

async function createPhoto(
  title: string,
  options: {
    takenAt?: string;
    tagGroups?: { categoryId: string; names: string[] }[];
  } = {},
) {
  const res = await api("/api/photos", {
    method: "POST",
    json: {
      cloudinaryPublicId: title,
      title,
      takenAt: options.takenAt ?? null,
      tagGroups: options.tagGroups ?? [],
    },
    cookie,
  });
  expect(res.status).toBe(201);
}

async function listTitles(query: Record<string, string>) {
  const res = await api(`/api/photos?${new URLSearchParams(query)}`);
  expect(res.status).toBe(200);
  const { items } = await res.json();
  return items.map((item: { title: string }) => item.title);
}

describe("写真のタグ絞り込み", () => {
  test("親タグと子タグの双方に一致する写真だけを返す", async () => {
    const vrchat = await createCategory("VRChat", cookie);
    const landscape = await createCategory("landscape", cookie);
    await createPhoto("match-old", {
      takenAt: "2026-06-01",
      tagGroups: [{ categoryId: vrchat.id, names: ["night"] }],
    });
    await createPhoto("match-new", {
      takenAt: "2026-07-01",
      tagGroups: [{ categoryId: vrchat.id, names: ["night", "friend"] }],
    });
    await createPhoto("other-tag", {
      tagGroups: [{ categoryId: vrchat.id, names: ["friend"] }],
    });
    await createPhoto("same-name-in-other-category", {
      tagGroups: [{ categoryId: landscape.id, names: ["night"] }],
    });
    await createPhoto("untagged");

    expect(await listTitles({ category: "VRChat", tag: "night" })).toEqual([
      "match-new",
      "match-old",
    ]);
  });

  test("親タグだけを指定すると該当する写真をすべて返す", async () => {
    const vrchat = await createCategory("VRChat", cookie);
    await createPhoto("a", {
      takenAt: "2026-07-01",
      tagGroups: [{ categoryId: vrchat.id, names: ["night"] }],
    });
    await createPhoto("b", {
      takenAt: "2026-06-01",
      tagGroups: [{ categoryId: vrchat.id, names: ["friend"] }],
    });
    await createPhoto("untagged");

    expect(await listTitles({ category: "VRChat" })).toEqual(["a", "b"]);
  });

  test("子タグのみの指定は422を返す", async () => {
    expect((await api("/api/photos?tag=night")).status).toBe(422);
  });

  test("親タグと一致しない子タグは422を返す", async () => {
    const vrchat = await createCategory("VRChat", cookie);
    await createPhoto("a", {
      tagGroups: [{ categoryId: vrchat.id, names: ["night"] }],
    });
    const res = await api("/api/photos?category=VRChat&tag=unknown");
    expect(res.status).toBe(422);
  });
});

describe("写真の月別アーカイブ", () => {
  test("新しい月順に件数を集計し、年月にならない撮影日を除く", async () => {
    await createPhoto("a", { takenAt: "2026-06-18" });
    await createPhoto("b", { takenAt: "2026-07-01" });
    await createPhoto("c", { takenAt: "2026-07-31" });
    await createPhoto("d", { takenAt: "2026/07/31" });

    const res = await api("/api/photos/archive");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { month: "2026-07", count: 2 },
      { month: "2026-06", count: 1 },
    ]);
  });

  test("撮影日がない写真は作成日時の年月で集計する", async () => {
    await createPhoto("a");
    const { items } = await (await api("/api/photos")).json();

    expect(await (await api("/api/photos/archive")).json()).toEqual([
      { month: items[0].createdAt.slice(0, 7), count: 1 },
    ]);
  });

  test("年月で絞り込め、タグと併用できる", async () => {
    const vrchat = await createCategory("VRChat", cookie);
    const tagGroups = [{ categoryId: vrchat.id, names: ["night"] }];
    await createPhoto("july-tagged", { takenAt: "2026-07-01", tagGroups });
    await createPhoto("july", { takenAt: "2026-07-02" });
    await createPhoto("june-tagged", { takenAt: "2026-06-01", tagGroups });

    expect(await listTitles({ month: "2026-07" })).toEqual([
      "july",
      "july-tagged",
    ]);
    expect(
      await listTitles({ month: "2026-07", category: "VRChat", tag: "night" }),
    ).toEqual(["july-tagged"]);
  });

  test("年月の絞り込み中もカーソルで続きを取得できる", async () => {
    await createPhoto("a", { takenAt: "2026-07-03" });
    await createPhoto("b", { takenAt: "2026-07-02" });
    await createPhoto("c", { takenAt: "2026-06-01" });

    const first = await (await api("/api/photos?month=2026-07&limit=1")).json();
    expect(first.nextCursor).toBe("2026-07-03");
    const second = await (
      await api(`/api/photos?month=2026-07&limit=1&cursor=${first.nextCursor}`)
    ).json();
    expect(second.items).toHaveLength(1);
    expect(second.items[0].title).toBe("b");
    expect(second.nextCursor).toBeNull();
  });

  test("不正な年月は400を返す", async () => {
    const res = await api("/api/photos?month=2026-7");
    expect(res.status).toBe(400);
  });
});

describe("写真の管理API", () => {
  test("未認証では一覧・登録・更新・削除ができない", async () => {
    const json = { cloudinaryPublicId: "a" };
    expect((await api("/api/photos/admin/all")).status).toBe(401);
    expect((await api("/api/photos", { method: "POST", json })).status).toBe(
      401,
    );
    expect(
      (await api("/api/photos/any", { method: "PUT", json: {} })).status,
    ).toBe(401);
    expect((await api("/api/photos/any", { method: "DELETE" })).status).toBe(
      401,
    );
  });

  test("タグを付け替えると以前のタグではヒットしない", async () => {
    const vrchat = await createCategory("VRChat", cookie);
    await createPhoto("a", {
      tagGroups: [{ categoryId: vrchat.id, names: ["night"] }],
    });
    const { items } = await (await api("/api/photos")).json();
    const res = await api(`/api/photos/${items[0].id}`, {
      method: "PUT",
      json: {
        title: "a",
        tagGroups: [{ categoryId: vrchat.id, names: ["friend"] }],
      },
      cookie,
    });
    expect(res.status).toBe(200);
    expect(await listTitles({ category: "VRChat", tag: "night" })).toEqual([]);
    expect(await listTitles({ category: "VRChat", tag: "friend" })).toEqual([
      "a",
    ]);
  });
});

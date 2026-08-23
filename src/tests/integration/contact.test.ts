import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { CONTACT_RATE_MAX_PER_WINDOW } from "@/lib/constants";

type SentMail = {
  name: string;
  email: string;
  comment: string;
  receivedAt: string;
};

const sent: SentMail[] = [];
let failSend = false;

mock.module("@/lib/mail", () => ({
  sendContactMail: async (input: SentMail) => {
    if (failSend) throw new Error("resend send failed: application_error");
    sent.push(input);
  },
}));

const { api, loginCookie, migrateTestDb, resetDb } = await import("./helpers");

let cookie: string;

beforeAll(async () => {
  await migrateTestDb();
  cookie = await loginCookie();
});

beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  failSend = false;
});

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "山田 太郎",
    email: "taro@example.com",
    comment: "はじめまして。",
    ...overrides,
  };
}

function post(overrides: Record<string, unknown> = {}) {
  return api("/api/contact", { method: "POST", json: makeInput(overrides) });
}

async function listAsAdmin() {
  const res = await api("/api/contact/admin/all", { cookie });
  expect(res.status).toBe(200);
  return res.json();
}

describe("お問い合わせ送信", () => {
  test("送信するとメールが飛び、DBにはメールアドレスが残らない", async () => {
    expect((await post()).status).toBe(201);

    expect(sent).toHaveLength(1);
    expect(sent[0].email).toBe("taro@example.com");

    const items = await listAsAdmin();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("山田 太郎");
    expect(items[0].comment).toBe("はじめまして。");
    expect(Object.keys(items[0])).toEqual([
      "id",
      "name",
      "comment",
      "createdAt",
    ]);
    expect(JSON.stringify(items)).not.toContain("taro@example.com");
  });

  test("honeypotが埋まっていると保存も送信もされない", async () => {
    expect((await post({ website: "http://spam" })).status).toBe(201);
    expect(sent).toHaveLength(0);
    expect(await listAsAdmin()).toHaveLength(0);
  });

  test("メール送信に失敗したら502で保存しない", async () => {
    failSend = true;
    expect((await post()).status).toBe(502);
    expect(await listAsAdmin()).toHaveLength(0);
  });

  test("名前に改行が含まれる入力は422", async () => {
    expect((await post({ name: "山田\nBcc: evil@example.com" })).status).toBe(
      422,
    );
    expect(sent).toHaveLength(0);
  });

  test("短時間に連投すると429で打ち切られる", async () => {
    for (let i = 0; i < CONTACT_RATE_MAX_PER_WINDOW; i++) {
      expect((await post()).status).toBe(201);
    }
    expect((await post()).status).toBe(429);
    expect(sent).toHaveLength(CONTACT_RATE_MAX_PER_WINDOW);
  });
});

describe("管理側の操作", () => {
  test("未認証では一覧・削除ができない", async () => {
    await post();
    expect((await api("/api/contact/admin/all")).status).toBe(401);
    const [item] = await listAsAdmin();
    expect(
      (await api(`/api/contact/${item.id}`, { method: "DELETE" })).status,
    ).toBe(401);
  });

  test("削除できる / 存在しないIDは404", async () => {
    await post();
    const [item] = await listAsAdmin();
    expect(
      (await api(`/api/contact/${item.id}`, { method: "DELETE", cookie }))
        .status,
    ).toBe(204);
    expect(await listAsAdmin()).toHaveLength(0);
    expect(
      (await api("/api/contact/missing", { method: "DELETE", cookie })).status,
    ).toBe(404);
  });
});

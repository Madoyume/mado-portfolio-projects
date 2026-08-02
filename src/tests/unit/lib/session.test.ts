import { expect, test } from "bun:test";
import { createSession, verifySession } from "@/lib/session";

test("発行したセッショントークンは検証を通る", async () => {
  const token = await createSession();
  expect(await verifySession(token)).toBe(true);
});

test("署名を改ざんしたトークンは拒否する", async () => {
  const token = await createSession();
  const [header, payload, signature] = token.split(".");
  const tampered = `${header}.${payload}.${"A".repeat(signature.length)}`;
  expect(await verifySession(tampered)).toBe(false);
});

test("JWT形式でない文字列は拒否する", async () => {
  expect(await verifySession("garbage")).toBe(false);
});

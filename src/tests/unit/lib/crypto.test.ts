import { expect, test } from "bun:test";
import { decryptText, encryptText } from "@/lib/crypto";

test("暗号化した文字列は復号で元に戻る", async () => {
  const stored = await encryptText("hello, 世界");
  expect(stored).not.toContain("hello");
  expect(await decryptText(stored)).toBe("hello, 世界");
});

test("同じ平文でも暗号文は毎回異なる", async () => {
  expect(await encryptText("same")).not.toBe(await encryptText("same"));
});

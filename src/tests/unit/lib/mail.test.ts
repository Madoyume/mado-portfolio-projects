import { expect, test } from "bun:test";
import { buildContactSubject, buildContactText } from "@/lib/mail";

const RECEIVED_AT = "2026-08-24T14:32:00.000+09:00";

test("件名から改行・制御文字が除去される", () => {
  const subject = buildContactSubject("山田\r\nBcc: evil@example.com");
  expect(subject).not.toContain("\n");
  expect(subject).not.toContain("\r");
  expect(subject).toContain("山田");
});

test("本文に受信日時・名前・メール・コメントが含まれる", () => {
  const text = buildContactText({
    name: "山田 太郎",
    email: "taro@example.com",
    comment: "はじめまして。",
    receivedAt: RECEIVED_AT,
  });
  expect(text).toContain("2026.08.24 14:32");
  expect(text).toContain("山田 太郎");
  expect(text).toContain("taro@example.com");
  expect(text).toContain("はじめまして。");
  expect(text).toContain("/admin/messages");
});

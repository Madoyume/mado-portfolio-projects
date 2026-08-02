import { afterEach, expect, setSystemTime, test } from "bun:test";
import { nowJst } from "@/lib/datetime";

afterEach(() => {
  setSystemTime();
});

test("現在時刻をJSTオフセット付きISO文字列で返す", () => {
  setSystemTime(new Date("2026-01-01T00:00:00Z"));
  expect(nowJst()).toBe("2026-01-01T09:00:00.000+09:00");
});

test("JSTで日付をまたぐ境界を正しく扱う", () => {
  setSystemTime(new Date("2025-12-31T15:30:00Z"));
  expect(nowJst()).toBe("2026-01-01T00:30:00.000+09:00");
});

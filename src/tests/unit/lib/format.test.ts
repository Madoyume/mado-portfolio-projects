import { describe, expect, test } from "bun:test";
import { formatDate, formatDateTime, formatMonth } from "@/lib/format";

describe("formatDate", () => {
  test("ISO文字列をJSTの YYYY.MM.DD に整形する", () => {
    expect(formatDate("2025-04-01T00:00:00+09:00")).toBe("2025.04.01");
  });

  test("UTCとJSTで日付が変わる境界を正しく扱う", () => {
    expect(formatDate("2025-12-31T15:00:00Z")).toBe("2026.01.01");
  });

  test("null・undefined・空文字は空文字を返す", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
  });

  test("日付として解釈できない文字列はそのまま返す", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateTime", () => {
  test("ISO文字列をJSTの YYYY.MM.DD HH:mm に整形する", () => {
    expect(formatDateTime("2025-01-02T03:04:00Z")).toBe("2025.01.02 12:04");
  });

  test("nullは空文字を返す", () => {
    expect(formatDateTime(null)).toBe("");
  });
});

describe("formatMonth", () => {
  test("YYYY-MM を YYYY.MM に整形する", () => {
    expect(formatMonth("2025-04")).toBe("2025.04");
  });

  test("nullは空文字を返す", () => {
    expect(formatMonth(null)).toBe("");
  });
});

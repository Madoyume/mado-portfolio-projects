import { describe, expect, test } from "bun:test";
import { displayTagName, normalizeTagName } from "@/lib/tags";

describe("タグ名の正規化", () => {
  test("前後空白・連続空白・全角英数を統一する", () => {
    expect(displayTagName("  Ｔｙｐｅ　Ｓｃｒｉｐｔ  ")).toBe("Type Script");
  });

  test("英字の大文字小文字を区別しない", () => {
    expect(normalizeTagName(" TypeScript ")).toBe("typescript");
    expect(normalizeTagName("typescript")).toBe("typescript");
  });
});

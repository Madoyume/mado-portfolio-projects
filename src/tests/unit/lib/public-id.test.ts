import { expect, test } from "bun:test";
import { stripFolder, withFolder } from "@/lib/public-id";

test("withFolderはフォルダ名を前置する", () => {
  expect(withFolder("abc123", "photos")).toBe("photos/abc123");
});

test("stripFolderはフォルダ名の前置を除去する", () => {
  expect(stripFolder("photos/abc123", "photos")).toBe("abc123");
});

test("withFolderとstripFolderは往復で元に戻る", () => {
  expect(stripFolder(withFolder("abc123", "photos"), "photos")).toBe("abc123");
});

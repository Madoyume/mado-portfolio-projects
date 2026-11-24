import { describe, expect, test } from "bun:test";
import { isSameOrder, moveTo, moveToEdge, shiftSelected } from "@/lib/reorder";

const ids = ["a", "b", "c", "d", "e"];

describe("moveTo", () => {
  test("後ろの位置へ移動できる", () => {
    expect(moveTo(ids, "b", 3)).toEqual(["a", "c", "d", "b", "e"]);
  });

  test("前の位置へ移動できる", () => {
    expect(moveTo(ids, "d", 0)).toEqual(["d", "a", "b", "c", "e"]);
  });

  test("末尾へ移動できる", () => {
    expect(moveTo(ids, "a", 4)).toEqual(["b", "c", "d", "e", "a"]);
  });

  test("存在しないIDなら並びを変えない", () => {
    expect(moveTo(ids, "x", 0)).toEqual(ids);
  });
});

describe("moveToEdge", () => {
  test("選択した項目を元の並びのまま先頭へ移動する", () => {
    expect(moveToEdge(ids, ["e", "c"], "start")).toEqual([
      "c",
      "e",
      "a",
      "b",
      "d",
    ]);
  });

  test("選択した項目を元の並びのまま末尾へ移動する", () => {
    expect(moveToEdge(ids, ["c", "a"], "end")).toEqual([
      "b",
      "d",
      "e",
      "a",
      "c",
    ]);
  });
});

describe("shiftSelected", () => {
  test("連続する選択をまとめて1つ前へ動かす", () => {
    expect(shiftSelected(ids, ["c", "d"], "backward")).toEqual([
      "a",
      "c",
      "d",
      "b",
      "e",
    ]);
  });

  test("連続する選択をまとめて1つ後ろへ動かす", () => {
    expect(shiftSelected(ids, ["b", "c"], "forward")).toEqual([
      "a",
      "d",
      "b",
      "c",
      "e",
    ]);
  });

  test("離れた選択をそれぞれ1つずつ動かす", () => {
    expect(shiftSelected(ids, ["b", "e"], "backward")).toEqual([
      "b",
      "a",
      "c",
      "e",
      "d",
    ]);
  });

  test("端に達した選択は動かさず、順序も入れ替えない", () => {
    expect(shiftSelected(ids, ["a", "b"], "backward")).toEqual(ids);
    expect(shiftSelected(ids, ["d", "e"], "forward")).toEqual(ids);
  });

  test("元の配列を変更しない", () => {
    const source = [...ids];
    shiftSelected(source, ["c"], "forward");
    shiftSelected(source, ["c"], "backward");
    expect(source).toEqual(ids);
  });
});

test("isSameOrderは順序まで一致する場合だけtrueを返す", () => {
  expect(isSameOrder(ids, [...ids])).toBe(true);
  expect(isSameOrder(ids, moveTo(ids, "a", 1))).toBe(false);
  expect(isSameOrder(ids, ids.slice(1))).toBe(false);
});

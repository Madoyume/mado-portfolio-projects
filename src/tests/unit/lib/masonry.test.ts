import { describe, expect, test } from "bun:test";
import { GALLERY_COLUMN_TOLERANCE } from "@/lib/constants";
import { distributeToColumns } from "@/lib/masonry";

const LANDSCAPE = { width: 1920, height: 1080 };
const PORTRAIT = { width: 1080, height: 1920 };

function makePhotos<T extends { width: number | null; height: number | null }>(
  sizes: T[],
  titles: (string | null)[] = [],
) {
  return sizes.map((size, i) => ({
    id: i + 1,
    title: titles[i] ?? null,
    ...size,
  }));
}

function ids(columns: { id: number }[][]) {
  return columns.map((column) => column.map((photo) => photo.id));
}

describe("写真のマソンリー配置", () => {
  test("同じ縦横比なら左から右へ横一列ずつ並ぶ", () => {
    const photos = makePhotos(Array.from({ length: 7 }, () => LANDSCAPE));
    expect(ids(distributeToColumns(photos, 3))).toEqual([
      [1, 4, 7],
      [2, 5],
      [3, 6],
    ]);
  });

  test("縦長の隣に空いた列へ後続の写真を詰める", () => {
    const photos = makePhotos([
      LANDSCAPE,
      PORTRAIT,
      PORTRAIT,
      LANDSCAPE,
      LANDSCAPE,
      LANDSCAPE,
    ]);
    expect(ids(distributeToColumns(photos, 3))).toEqual([
      [1, 4, 5, 6],
      [2],
      [3],
    ]);
  });

  test("わずかな高さの差やキャプションの有無では左から右の順を崩さない", () => {
    const photos = makePhotos(
      [
        LANDSCAPE,
        { width: 1366, height: 768 },
        LANDSCAPE,
        LANDSCAPE,
        LANDSCAPE,
        LANDSCAPE,
      ],
      ["タイトル"],
    );
    expect(ids(distributeToColumns(photos, 3))).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  test("追加読み込みしても既存の写真の配置は変わらない", () => {
    const photos = makePhotos(
      Array.from({ length: 40 }, (_, i) =>
        i % 3 === 1 ? PORTRAIT : LANDSCAPE,
      ),
    );
    const before = ids(distributeToColumns(photos.slice(0, 20), 3));
    const after = ids(distributeToColumns(photos, 3));
    before.forEach((column, i) => {
      expect(after[i].slice(0, column.length)).toEqual(column);
    });
  });

  test.each([2, 3])(
    "縦横比が混在しても%d列の高さの差は縦長1枚分に収まる",
    (count) => {
      const photos = makePhotos(
        Array.from({ length: 60 }, (_, i) =>
          i % 5 === 0 || i % 7 === 0 ? PORTRAIT : LANDSCAPE,
        ),
      );
      const heights = distributeToColumns(photos, count).map((column) =>
        column.reduce((sum, photo) => sum + photo.height / photo.width, 0),
      );
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(
        PORTRAIT.height / PORTRAIT.width + GALLERY_COLUMN_TOLERANCE,
      );
    },
  );

  test("写真が列数より少なくても列数は変わらず、サイズ不明でも配置できる", () => {
    const photos = makePhotos([{ width: null, height: null }, LANDSCAPE]);
    expect(ids(distributeToColumns(photos, 3))).toEqual([[1], [2], []]);
  });
});

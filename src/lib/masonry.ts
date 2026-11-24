import {
  GALLERY_CAPTION_RATIO,
  GALLERY_COLUMN_TOLERANCE,
  GALLERY_FALLBACK_RATIO,
} from "./constants";

type MasonryItem = {
  width: number | null;
  height: number | null;
  title: string | null;
};

function estimateHeight({ width, height, title }: MasonryItem) {
  const ratio = width && height ? height / width : GALLERY_FALLBACK_RATIO;
  return title ? ratio + GALLERY_CAPTION_RATIO : ratio;
}

export function distributeToColumns<T extends MasonryItem>(
  items: T[],
  columnCount: number,
) {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  const heights = columns.map(() => 0);
  for (const item of items) {
    const limit = Math.min(...heights) + GALLERY_COLUMN_TOLERANCE;
    const target = heights.findIndex((height) => height <= limit);
    columns[target].push(item);
    heights[target] += estimateHeight(item);
  }
  return columns;
}

import { z } from "zod";

const tagName = z.string().min(1).max(80);

export const tagGroupInput = z.object({
  categoryId: z.string().uuid(),
  names: z.array(tagName).min(1).max(20),
});

export const tagGroupsInput = z.array(tagGroupInput).max(20).default([]);

export type TagGroupsInput = z.infer<typeof tagGroupsInput>;

export const tagCategoryInput = z.object({
  name: tagName,
});

export const tagCategoryOrderInput = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const tagUpdateInput = z.object({
  name: tagName.optional(),
  categoryId: z.string().uuid().optional(),
});

export const tagMergeInput = z.object({
  targetTagId: z.string().uuid(),
});

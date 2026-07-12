import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "@/db/schema";
import {
  ARCHIVE_MONTH_REGEX,
  LIST_LIMIT_DEFAULT,
  LIST_LIMIT_MAX,
  POST_STATUS,
  SLUG_REGEX,
} from "@/lib/constants";

export const postListQuery = z.object({
  tag: z.string().optional(),
  month: z.string().regex(ARCHIVE_MONTH_REGEX).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIST_LIMIT_MAX)
    .default(LIST_LIMIT_DEFAULT),
  page: z.coerce.number().int().min(1).default(1),
});

export const postInput = createInsertSchema(posts, {
  slug: (s) => s.regex(SLUG_REGEX),
  status: z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED]).optional(),
  tags: z.array(z.string()).nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });

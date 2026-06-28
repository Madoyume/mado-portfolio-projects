import { z } from "zod";

export const articleListQuery = z.object({
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

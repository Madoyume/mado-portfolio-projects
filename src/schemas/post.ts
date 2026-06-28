import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "@/db/schema";

export const postListQuery = z.object({
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const postInput = createInsertSchema(posts, {
  slug: (s) => s.regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "published"]).optional(),
  tags: z.array(z.string()).nullish(),
}).omit({ id: true, createdAt: true, updatedAt: true });

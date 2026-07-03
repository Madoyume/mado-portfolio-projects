import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { photos } from "@/db/schema";

export const photoMetaInput = createUpdateSchema(photos, {
  tags: z.array(z.string()).nullish(),
}).pick({
  title: true,
  description: true,
  takenAt: true,
  tags: true,
});

export const photoCreateInput = createInsertSchema(photos, {
  tags: z.array(z.string()).nullish(),
}).pick({
  cloudinaryPublicId: true,
  width: true,
  height: true,
  title: true,
  description: true,
  takenAt: true,
  tags: true,
});

export const photoListQuery = z.object({
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

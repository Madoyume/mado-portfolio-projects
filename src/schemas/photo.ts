import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { photos } from "@/db/schema";
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from "@/lib/constants";
import { tagGroupsInput } from "./tag";

export const photoMetaInput = createUpdateSchema(photos)
  .pick({
    title: true,
    description: true,
    takenAt: true,
  })
  .extend({ tagGroups: tagGroupsInput });

export const photoCreateInput = createInsertSchema(photos)
  .pick({
    cloudinaryPublicId: true,
    width: true,
    height: true,
    title: true,
    description: true,
    takenAt: true,
  })
  .extend({ tagGroups: tagGroupsInput });

export const photoListQuery = z.object({
  category: z.string().min(1).max(80).optional(),
  tag: z.string().min(1).max(80).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIST_LIMIT_MAX)
    .default(LIST_LIMIT_DEFAULT),
  cursor: z.string().optional(),
});

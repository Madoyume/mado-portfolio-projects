import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { profile } from "@/db/schema";

export const profileInput = createInsertSchema(profile, {
  socialLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
        iconUrl: z.string().url().optional(),
      }),
    )
    .nullish(),
}).omit({ id: true, updatedAt: true });

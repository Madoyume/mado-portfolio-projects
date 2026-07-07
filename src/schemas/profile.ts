import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { profile } from "@/db/schema";

export const profileInput = createInsertSchema(profile, {
  socialLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
        iconId: z.string().optional(),
        iconIdDark: z.string().optional(),
      }),
    )
    .nullish(),
}).omit({ id: true, updatedAt: true, hasAvatar: true, hasHero: true });

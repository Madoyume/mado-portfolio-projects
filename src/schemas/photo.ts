import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { photos } from "@/db/schema";

export const photoMetaInput = createUpdateSchema(photos).pick({
  title: true,
  description: true,
  takenAt: true,
  sortOrder: true,
});

export const photoCreateInput = createInsertSchema(photos).pick({
  cloudinaryPublicId: true,
  width: true,
  height: true,
  title: true,
  description: true,
  takenAt: true,
});

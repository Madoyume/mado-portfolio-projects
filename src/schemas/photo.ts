import { createUpdateSchema } from "drizzle-zod";
import { photos } from "@/db/schema";

export const photoMetaInput = createUpdateSchema(photos).pick({
  title: true,
  description: true,
  takenAt: true,
  sortOrder: true,
});

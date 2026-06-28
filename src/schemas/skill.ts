import { createInsertSchema } from "drizzle-zod";
import { skills } from "@/db/schema";

export const skillInput = createInsertSchema(skills).omit({ id: true });

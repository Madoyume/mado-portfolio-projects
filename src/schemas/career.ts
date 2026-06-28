import { createInsertSchema } from "drizzle-zod";
import { careers } from "@/db/schema";

export const careerInput = createInsertSchema(careers).omit({ id: true });

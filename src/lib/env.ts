import { z } from "zod";

const schema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

export const env = schema.parse(process.env);

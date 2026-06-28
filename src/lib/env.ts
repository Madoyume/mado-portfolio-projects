import { z } from "zod";

const dbSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

const authSchema = z.object({
  ADMIN_TOKEN: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

let dbCache: z.infer<typeof dbSchema> | undefined;
let authCache: z.infer<typeof authSchema> | undefined;

export function getEnv() {
  if (!dbCache) dbCache = dbSchema.parse(process.env);
  return dbCache;
}

export function getAuthEnv() {
  if (!authCache) authCache = authSchema.parse(process.env);
  return authCache;
}

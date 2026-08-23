import { z } from "zod";

const dbSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

const authSchema = z.object({
  ADMIN_TOKEN: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const mailSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_MAIL_TO: z.email(),
  CONTACT_MAIL_FROM: z.string().min(1),
});

let dbCache: z.infer<typeof dbSchema> | undefined;
let authCache: z.infer<typeof authSchema> | undefined;
let cloudinaryCache: z.infer<typeof cloudinarySchema> | undefined;
let mailCache: z.infer<typeof mailSchema> | undefined;

export function getEnv() {
  if (!dbCache) dbCache = dbSchema.parse(process.env);
  return dbCache;
}

export function getAuthEnv() {
  if (!authCache) authCache = authSchema.parse(process.env);
  return authCache;
}

export function getCloudinaryEnv() {
  if (!cloudinaryCache) cloudinaryCache = cloudinarySchema.parse(process.env);
  return cloudinaryCache;
}

export function getMailEnv() {
  if (!mailCache) mailCache = mailSchema.parse(process.env);
  return mailCache;
}

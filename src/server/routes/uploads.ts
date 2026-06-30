import { Hono } from "hono";
import { z } from "zod";
import { signUpload } from "@/lib/cloudinary";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

const signInput = z.object({
  folder: z.string().optional(),
  publicId: z.string().optional(),
});

export const uploadsRoute = new Hono().post(
  "/sign",
  requireAuth,
  zJson(signInput),
  (c) => {
    try {
      return c.json(signUpload(c.req.valid("json")));
    } catch (err) {
      if (err instanceof Error && /not allowed/.test(err.message)) {
        return c.json({ message: err.message }, 422);
      }
      throw err;
    }
  },
);

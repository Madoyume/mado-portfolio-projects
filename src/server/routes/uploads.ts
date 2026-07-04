import { Hono } from "hono";
import { z } from "zod";
import { deleteImage, listImages, signUpload } from "@/lib/cloudinary";
import { BLOG_FOLDER, SLUG_REGEX } from "@/lib/constants";
import { requireAuth } from "@/server/middleware/auth";
import { zJson } from "@/server/validator";

const signInput = z.object({
  folder: z.string().optional(),
  publicId: z.string().optional(),
});

const deleteInput = z.object({ publicId: z.string() });

export const uploadsRoute = new Hono()
  .post("/sign", requireAuth, zJson(signInput), (c) => {
    try {
      return c.json(signUpload(c.req.valid("json")));
    } catch (err) {
      if (err instanceof Error && /not allowed/.test(err.message)) {
        return c.json({ message: err.message }, 422);
      }
      throw err;
    }
  })
  .get("/blog/:slug/images", requireAuth, async (c) => {
    const slug = c.req.param("slug");
    if (!SLUG_REGEX.test(slug)) {
      return c.json({ message: "invalid slug" }, 400);
    }
    const images = await listImages(`${BLOG_FOLDER}/${slug}`);
    return c.json(images);
  })
  .delete("/blog/:slug/image", requireAuth, zJson(deleteInput), async (c) => {
    const slug = c.req.param("slug");
    const { publicId } = c.req.valid("json");
    if (!SLUG_REGEX.test(slug)) {
      return c.json({ message: "invalid slug" }, 400);
    }
    if (!publicId.startsWith(`${BLOG_FOLDER}/${slug}/`)) {
      return c.json({ message: "not allowed" }, 400);
    }
    await deleteImage(publicId);
    return c.body(null, 204);
  });

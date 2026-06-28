import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

export function zJson<T extends ZodType>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { message: "validation error", issues: result.error.issues },
        422,
      );
    }
  });
}

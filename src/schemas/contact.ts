import { z } from "zod";
import {
  CONTACT_COMMENT_MAX,
  CONTACT_EMAIL_MAX,
  CONTACT_NAME_MAX,
  CONTACT_NAME_REGEX,
} from "@/lib/constants";

export const contactInput = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(CONTACT_NAME_MAX)
    .regex(CONTACT_NAME_REGEX),
  email: z.email().max(CONTACT_EMAIL_MAX),
  comment: z.string().trim().min(1).max(CONTACT_COMMENT_MAX),
  website: z.string().optional(),
});

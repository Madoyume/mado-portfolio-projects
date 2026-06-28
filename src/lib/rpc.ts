import { hc } from "hono/client";
import type { AppType } from "@/server";

const baseUrl =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    : "";

export const client = hc<AppType>(baseUrl);

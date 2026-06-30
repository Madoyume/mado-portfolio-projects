import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { blogRoute } from "./routes/blog";
import { careersRoute } from "./routes/careers";
import { photosRoute } from "./routes/photos";
import { profileRoute } from "./routes/profile";
import { skillsRoute } from "./routes/skills";
import { uploadsRoute } from "./routes/uploads";

const app = new Hono()
  .basePath("/api")
  .route("/auth", authRoute)
  .route("/profile", profileRoute)
  .route("/careers", careersRoute)
  .route("/skills", skillsRoute)
  .route("/blog", blogRoute)
  .route("/photos", photosRoute)
  .route("/uploads", uploadsRoute);

export { app };
export type AppType = typeof app;

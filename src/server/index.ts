import { Hono } from "hono";
import { blogRoute } from "./routes/blog";
import { careersRoute } from "./routes/careers";
import { photosRoute } from "./routes/photos";
import { profileRoute } from "./routes/profile";
import { skillsRoute } from "./routes/skills";

const app = new Hono()
  .basePath("/api")
  .route("/profile", profileRoute)
  .route("/careers", careersRoute)
  .route("/skills", skillsRoute)
  .route("/blog", blogRoute)
  .route("/photos", photosRoute);

export { app };
export type AppType = typeof app;

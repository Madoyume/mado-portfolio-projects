import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { POST_STATUS, type PostStatus, PROFILE_ID } from "../lib/constants";

type SocialLink = {
  label: string;
  url: string;
  iconUrl?: string;
  iconUrlDark?: string;
};

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const now = () => new Date().toISOString();

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey().default(PROFILE_ID),
  name: text("name").notNull(),
  headline: text("headline").notNull(),
  bio: text("bio"),
  location: text("location"),
  email: text("email"),
  socialLinks: text("social_links", { mode: "json" }).$type<SocialLink[]>(),
  avatarUrl: text("avatar_url"),
  heroImageUrl: text("hero_image_url"),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
});

export const careers = sqliteTable("careers", {
  id: id(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
});

export const skills = sqliteTable("skills", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: integer("level"),
});

export const posts = sqliteTable("posts", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  body: text("body").notNull(),
  coverImageUrl: text("cover_image_url"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  status: text("status")
    .$type<PostStatus>()
    .notNull()
    .default(POST_STATUS.DRAFT),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().$defaultFn(now),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
});

export const photos = sqliteTable("photos", {
  id: id(),
  title: text("title"),
  description: text("description"),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  width: integer("width"),
  height: integer("height"),
  takenAt: text("taken_at"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const schema = { profile, careers, skills, posts, photos };

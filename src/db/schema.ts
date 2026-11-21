import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { POST_STATUS, type PostStatus, PROFILE_ID } from "../lib/constants";
import { nowJst } from "../lib/datetime";

type SocialLink = {
  label: string;
  url: string;
  iconId?: string;
  iconIdDark?: string;
};

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey().default(PROFILE_ID),
  name: text("name").notNull(),
  headline: text("headline").notNull(),
  bio: text("bio"),
  location: text("location"),
  email: text("email"),
  socialLinks: text("social_links", { mode: "json" }).$type<SocialLink[]>(),
  avatarVersion: integer("avatar_version"),
  heroVersion: integer("hero_version"),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(nowJst)
    .$onUpdateFn(nowJst),
});

export const heroImages = sqliteTable("hero_images", {
  id: id(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull().unique(),
  version: integer("version").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowJst),
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
  coverImageId: text("cover_image_id"),
  status: text("status")
    .$type<PostStatus>()
    .notNull()
    .default(POST_STATUS.DRAFT),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().$defaultFn(nowJst),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(nowJst)
    .$onUpdateFn(nowJst),
});

export const photos = sqliteTable("photos", {
  id: id(),
  title: text("title"),
  description: text("description"),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  width: integer("width"),
  height: integer("height"),
  takenAt: text("taken_at"),
  createdAt: text("created_at").notNull().$defaultFn(nowJst),
});

export const tagCategories = sqliteTable(
  "tag_categories",
  {
    id: id(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(nowJst),
  },
  (table) => [
    unique("tag_categories_normalized_name_unique").on(table.normalizedName),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: id(),
    categoryId: text("category_id").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(nowJst),
  },
  (table) => [
    unique("tags_category_normalized_name_unique").on(
      table.categoryId,
      table.normalizedName,
    ),
  ],
);

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const photoTags = sqliteTable(
  "photo_tags",
  {
    photoId: text("photo_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.photoId, table.tagId] })],
);

export const contactMessages = sqliteTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowJst),
});

export const schema = {
  profile,
  heroImages,
  careers,
  skills,
  posts,
  photos,
  tagCategories,
  tags,
  postTags,
  photoTags,
  contactMessages,
};

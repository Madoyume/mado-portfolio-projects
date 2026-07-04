// # all
export const SLUG_PATTERN = "[a-z0-9-]+";
export const SLUG_REGEX = new RegExp(`^${SLUG_PATTERN}$`);

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const LIST_LIMIT_DEFAULT = 20;
export const LIST_LIMIT_MAX = 100;

// # cloudinary
export const CLOUDINARY_ROOT = "mado";
export const CLOUDINARY_DELIVERY_BASE = "https://res.cloudinary.com";
export const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

// # profile
export const PROFILE_ID = "default";
export const HERO_PUBLIC_ID = `${CLOUDINARY_ROOT}/hero`;
export const AVATAR_PUBLIC_ID = `${CLOUDINARY_ROOT}/avatar`;
export const SOCIAL_FOLDER = `${CLOUDINARY_ROOT}/social`;

// # photos
export const PHOTOS_FOLDER = `${CLOUDINARY_ROOT}/photos`;
export const PHOTOS_PAGE_SIZE = 20;

// # blog
export const BLOG_FOLDER = `${CLOUDINARY_ROOT}/blog`;
export const BLOG_PAGE_SIZE = 10;
export const BLOG_IMAGE_LIST_MAX = 100;

export const POST_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

// # home
export const HOME_FEATURED_LIMIT = 3;

// # admin
export const ADMIN_RECENT_COUNT = 5;

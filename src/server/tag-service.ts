import { and, asc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { photoTags, posts, postTags, tagCategories, tags } from "@/db/schema";
import { POST_STATUS } from "@/lib/constants";
import { nowJst } from "@/lib/datetime";
import { displayTagName, normalizeTagName } from "@/lib/tags";
import type { TagGroupsInput } from "@/schemas/tag";

export type TagItem = { id: string; name: string };
export type TagCategoryItem = { id: string; name: string; tags: TagItem[] };

export class TagInputError extends Error {}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function groupRows(
  rows: {
    categoryId: string;
    categoryName: string;
    tagId: string;
    tagName: string;
  }[],
) {
  const byCategory = new Map<string, TagCategoryItem>();
  for (const row of rows) {
    const category = byCategory.get(row.categoryId) ?? {
      id: row.categoryId,
      name: row.categoryName,
      tags: [],
    };
    category.tags.push({ id: row.tagId, name: row.tagName });
    byCategory.set(row.categoryId, category);
  }
  return [...byCategory.values()];
}

export async function getTagCategories() {
  const rows = await db
    .select({
      categoryId: tagCategories.id,
      categoryName: tagCategories.name,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(tagCategories)
    .leftJoin(tags, eq(tags.categoryId, tagCategories.id))
    .orderBy(
      asc(tagCategories.sortOrder),
      asc(tagCategories.name),
      asc(tags.name),
    );
  const byCategory = new Map<string, TagCategoryItem>();
  for (const row of rows) {
    const category = byCategory.get(row.categoryId) ?? {
      id: row.categoryId,
      name: row.categoryName,
      tags: [],
    };
    if (row.tagId && row.tagName)
      category.tags.push({ id: row.tagId, name: row.tagName });
    byCategory.set(row.categoryId, category);
  }
  return [...byCategory.values()];
}

export async function getPostTagGroups(postIds: string[]) {
  if (postIds.length === 0) return new Map<string, TagCategoryItem[]>();
  const rows = await db
    .select({
      postId: postTags.postId,
      categoryId: tagCategories.id,
      categoryName: tagCategories.name,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .where(inArray(postTags.postId, postIds))
    .orderBy(asc(tagCategories.sortOrder), asc(tags.name));
  const byPost = new Map<string, typeof rows>();
  for (const row of rows)
    byPost.set(row.postId, [...(byPost.get(row.postId) ?? []), row]);
  return new Map(
    postIds.map((id) => [
      id,
      groupRows((byPost.get(id) ?? []).map(({ postId: _, ...row }) => row)),
    ]),
  );
}

export async function getPhotoTagGroups(photoIds: string[]) {
  if (photoIds.length === 0) return new Map<string, TagCategoryItem[]>();
  const rows = await db
    .select({
      photoId: photoTags.photoId,
      categoryId: tagCategories.id,
      categoryName: tagCategories.name,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(photoTags)
    .innerJoin(tags, eq(tags.id, photoTags.tagId))
    .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
    .where(inArray(photoTags.photoId, photoIds))
    .orderBy(asc(tagCategories.sortOrder), asc(tags.name));
  const byPhoto = new Map<string, typeof rows>();
  for (const row of rows)
    byPhoto.set(row.photoId, [...(byPhoto.get(row.photoId) ?? []), row]);
  return new Map(
    photoIds.map((id) => [
      id,
      groupRows((byPhoto.get(id) ?? []).map(({ photoId: _, ...row }) => row)),
    ]),
  );
}

export async function getPublicBlogTagCategories() {
  const rows = await db
    .select({
      categoryId: tagCategories.id,
      categoryName: tagCategories.name,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(tagCategories)
    .innerJoin(tags, eq(tags.categoryId, tagCategories.id))
    .innerJoin(postTags, eq(postTags.tagId, tags.id))
    .innerJoin(posts, eq(posts.id, postTags.postId))
    .where(
      and(
        eq(posts.status, POST_STATUS.PUBLISHED),
        isNotNull(posts.publishedAt),
        lte(posts.publishedAt, nowJst()),
      ),
    )
    .groupBy(tagCategories.id, tags.id)
    .orderBy(asc(tagCategories.sortOrder), asc(tags.name));
  return groupRows(rows);
}

export async function getPublicPhotoTagCategories() {
  const rows = await db
    .select({
      categoryId: tagCategories.id,
      categoryName: tagCategories.name,
      tagId: tags.id,
      tagName: tags.name,
    })
    .from(tagCategories)
    .innerJoin(tags, eq(tags.categoryId, tagCategories.id))
    .innerJoin(photoTags, eq(photoTags.tagId, tags.id))
    .groupBy(tagCategories.id, tags.id)
    .orderBy(asc(tagCategories.sortOrder), asc(tags.name));
  return groupRows(rows);
}

async function resolveTagIds(tx: Transaction, groups: TagGroupsInput) {
  await validateTagGroups(groups);
  const categoryIds = [...new Set(groups.map((group) => group.categoryId))];
  if (categoryIds.length === 0) return [];

  const tagIds = new Set<string>();
  for (const group of groups) {
    for (const value of group.names) {
      const name = displayTagName(value);
      const normalizedName = normalizeTagName(value);
      if (!name || !normalizedName) throw new TagInputError("invalid tag");
      const [existing] = await tx
        .select({ id: tags.id })
        .from(tags)
        .where(
          and(
            eq(tags.categoryId, group.categoryId),
            eq(tags.normalizedName, normalizedName),
          ),
        )
        .limit(1);
      if (existing) {
        tagIds.add(existing.id);
        continue;
      }
      const [created] = await tx
        .insert(tags)
        .values({ categoryId: group.categoryId, name, normalizedName })
        .returning({ id: tags.id });
      tagIds.add(created.id);
    }
  }
  return [...tagIds];
}

export async function validateTagGroups(groups: TagGroupsInput) {
  const categoryIds = [...new Set(groups.map((group) => group.categoryId))];
  if (categoryIds.length > 0) {
    const categories = await db
      .select({ id: tagCategories.id })
      .from(tagCategories)
      .where(inArray(tagCategories.id, categoryIds));
    if (categories.length !== categoryIds.length)
      throw new TagInputError("invalid category");
  }
  for (const group of groups) {
    for (const value of group.names) {
      if (!displayTagName(value) || !normalizeTagName(value)) {
        throw new TagInputError("invalid tag");
      }
    }
  }
}

export async function replacePostTags(postId: string, groups: TagGroupsInput) {
  await db.transaction(async (tx) => {
    const tagIds = await resolveTagIds(tx, groups);
    await tx.delete(postTags).where(eq(postTags.postId, postId));
    if (tagIds.length > 0) {
      await tx
        .insert(postTags)
        .values(tagIds.map((tagId) => ({ postId, tagId })));
    }
  });
}

export async function replacePhotoTags(
  photoId: string,
  groups: TagGroupsInput,
) {
  await db.transaction(async (tx) => {
    const tagIds = await resolveTagIds(tx, groups);
    await tx.delete(photoTags).where(eq(photoTags.photoId, photoId));
    if (tagIds.length > 0) {
      await tx
        .insert(photoTags)
        .values(tagIds.map((tagId) => ({ photoId, tagId })));
    }
  });
}

export async function resolveTagFilter(
  categoryName?: string,
  tagName?: string,
) {
  if (!categoryName && !tagName) return {};
  if (!categoryName) return null;
  const normalizedCategoryName = normalizeTagName(categoryName);
  if (!normalizedCategoryName) return null;
  const [category] = await db
    .select({ id: tagCategories.id })
    .from(tagCategories)
    .where(eq(tagCategories.normalizedName, normalizedCategoryName))
    .limit(1);
  if (!category) return null;
  if (!tagName) return { categoryId: category.id };
  const normalizedTagName = normalizeTagName(tagName);
  if (!normalizedTagName) return null;
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(
      and(
        eq(tags.categoryId, category.id),
        eq(tags.normalizedName, normalizedTagName),
      ),
    )
    .limit(1);
  return tag ? { categoryId: category.id, tagId: tag.id } : null;
}

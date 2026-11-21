import { asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db/client";
import { photoTags, postTags, tagCategories, tags } from "@/db/schema";
import { displayTagName, normalizeTagName } from "@/lib/tags";
import {
  tagCategoryInput,
  tagCategoryOrderInput,
  tagMergeInput,
  tagUpdateInput,
} from "@/schemas/tag";
import { requireAuth } from "@/server/middleware/auth";
import { getTagCategories } from "@/server/tag-service";
import { zJson } from "@/server/validator";

function conflict(error: unknown) {
  return error instanceof Error && /unique/i.test(error.message);
}

export const tagCategoriesRoute = new Hono()
  .get("/", requireAuth, async (c) => c.json(await getTagCategories()))
  .post("/", requireAuth, zJson(tagCategoryInput), async (c) => {
    const input = c.req.valid("json");
    const name = displayTagName(input.name);
    const normalizedName = normalizeTagName(input.name);
    if (!name) return c.json({ message: "invalid category" }, 422);
    const [last] = await db
      .select({ sortOrder: tagCategories.sortOrder })
      .from(tagCategories)
      .orderBy(desc(tagCategories.sortOrder));
    try {
      const [row] = await db
        .insert(tagCategories)
        .values({
          name,
          normalizedName,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        })
        .returning();
      return c.json(row, 201);
    } catch (error) {
      if (conflict(error))
        return c.json({ message: "category already exists" }, 409);
      throw error;
    }
  })
  .put("/order", requireAuth, zJson(tagCategoryOrderInput), async (c) => {
    const { ids } = c.req.valid("json");
    const rows = await db.select({ id: tagCategories.id }).from(tagCategories);
    if (rows.length !== ids.length || new Set(ids).size !== ids.length) {
      return c.json({ message: "invalid category order" }, 422);
    }
    const rowIds = new Set(rows.map((row) => row.id));
    if (ids.some((id) => !rowIds.has(id))) {
      return c.json({ message: "invalid category order" }, 422);
    }
    await db.transaction(async (tx) => {
      await Promise.all(
        ids.map((id, sortOrder) =>
          tx
            .update(tagCategories)
            .set({ sortOrder })
            .where(eq(tagCategories.id, id)),
        ),
      );
    });
    return c.json(await getTagCategories());
  })
  .put("/:id", requireAuth, zJson(tagCategoryInput), async (c) => {
    const input = c.req.valid("json");
    const name = displayTagName(input.name);
    const normalizedName = normalizeTagName(input.name);
    if (!name || !normalizedName)
      return c.json({ message: "invalid category" }, 422);
    try {
      const [row] = await db
        .update(tagCategories)
        .set({ name, normalizedName })
        .where(eq(tagCategories.id, c.req.param("id")))
        .returning();
      if (!row) return c.json({ message: "category not found" }, 404);
      return c.json(row);
    } catch (error) {
      if (conflict(error))
        return c.json({ message: "category already exists" }, 409);
      throw error;
    }
  })
  .delete("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    const [tag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.categoryId, id))
      .limit(1);
    if (tag) return c.json({ message: "category has tags" }, 409);
    const [row] = await db
      .delete(tagCategories)
      .where(eq(tagCategories.id, id))
      .returning();
    if (!row) return c.json({ message: "category not found" }, 404);
    return c.body(null, 204);
  })
  .get("/children/all", requireAuth, async (c) => {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        categoryId: tagCategories.id,
        categoryName: tagCategories.name,
      })
      .from(tags)
      .innerJoin(tagCategories, eq(tagCategories.id, tags.categoryId))
      .orderBy(asc(tagCategories.sortOrder), asc(tags.name));
    return c.json(rows);
  })
  .put("/children/:id", requireAuth, zJson(tagUpdateInput), async (c) => {
    const input = c.req.valid("json");
    const [current] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, c.req.param("id")))
      .limit(1);
    if (!current) return c.json({ message: "tag not found" }, 404);
    const categoryId = input.categoryId ?? current.categoryId;
    if (input.categoryId) {
      const [category] = await db
        .select({ id: tagCategories.id })
        .from(tagCategories)
        .where(eq(tagCategories.id, input.categoryId))
        .limit(1);
      if (!category) return c.json({ message: "category not found" }, 422);
    }
    const name = input.name ? displayTagName(input.name) : current.name;
    const normalizedName = input.name
      ? normalizeTagName(input.name)
      : current.normalizedName;
    try {
      const [row] = await db
        .update(tags)
        .set({ categoryId, name, normalizedName })
        .where(eq(tags.id, current.id))
        .returning();
      return c.json(row);
    } catch (error) {
      if (conflict(error))
        return c.json({ message: "tag already exists" }, 409);
      throw error;
    }
  })
  .post("/children/:id/merge", requireAuth, zJson(tagMergeInput), async (c) => {
    const id = c.req.param("id");
    const { targetTagId } = c.req.valid("json");
    if (id === targetTagId) return c.json({ message: "same tag" }, 422);
    const rows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, [id, targetTagId]));
    if (rows.length !== 2) return c.json({ message: "tag not found" }, 404);
    await db.transaction(async (tx) => {
      const postRows = await tx
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagId, id));
      const photoRows = await tx
        .select({ photoId: photoTags.photoId })
        .from(photoTags)
        .where(eq(photoTags.tagId, id));
      if (postRows.length) {
        await tx
          .insert(postTags)
          .values(
            postRows.map(({ postId }) => ({ postId, tagId: targetTagId })),
          )
          .onConflictDoNothing();
      }
      if (photoRows.length) {
        await tx
          .insert(photoTags)
          .values(
            photoRows.map(({ photoId }) => ({ photoId, tagId: targetTagId })),
          )
          .onConflictDoNothing();
      }
      await tx.delete(postTags).where(eq(postTags.tagId, id));
      await tx.delete(photoTags).where(eq(photoTags.tagId, id));
      await tx.delete(tags).where(eq(tags.id, id));
    });
    return c.body(null, 204);
  })
  .delete("/children/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    const [postTag] = await db
      .select({ tagId: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.tagId, id))
      .limit(1);
    const [photoTag] = await db
      .select({ tagId: photoTags.tagId })
      .from(photoTags)
      .where(eq(photoTags.tagId, id))
      .limit(1);
    if (postTag || photoTag) return c.json({ message: "tag is in use" }, 409);
    const [row] = await db.delete(tags).where(eq(tags.id, id)).returning();
    if (!row) return c.json({ message: "tag not found" }, 404);
    return c.body(null, 204);
  });

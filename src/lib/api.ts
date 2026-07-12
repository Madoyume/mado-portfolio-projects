import { cache } from "react";
import { client } from "./rpc";

export const getProfile = cache(async () => {
  const res = await client.api.profile.$get();
  return res.ok ? await res.json() : null;
});

export const getCareers = cache(async () => {
  const res = await client.api.careers.$get();
  return res.ok ? await res.json() : [];
});

export const getSkills = cache(async () => {
  const res = await client.api.skills.$get();
  return res.ok ? await res.json() : [];
});

type PhotoQuery = { tag?: string; limit?: number; cursor?: string };

export const getPhotos = cache(async (query: PhotoQuery = {}) => {
  const res = await client.api.photos.$get({
    query: {
      ...(query.tag ? { tag: query.tag } : {}),
      ...(query.limit ? { limit: String(query.limit) } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
    },
  });
  return res.ok ? await res.json() : { items: [], nextCursor: null };
});

export const getPhotoTags = cache(async () => {
  const res = await client.api.photos.tags.$get();
  return res.ok ? await res.json() : [];
});

type PostQuery = {
  tag?: string;
  month?: string;
  limit?: number;
  cursor?: string;
};

export const getPosts = cache(async (query: PostQuery = {}) => {
  const res = await client.api.blog.$get({
    query: {
      ...(query.tag ? { tag: query.tag } : {}),
      ...(query.month ? { month: query.month } : {}),
      ...(query.limit ? { limit: String(query.limit) } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
    },
  });
  return res.ok ? await res.json() : { items: [], nextCursor: null };
});

export const getBlogTags = cache(async () => {
  const res = await client.api.blog.tags.$get();
  return res.ok ? await res.json() : [];
});

export const getBlogArchive = cache(async () => {
  const res = await client.api.blog.archive.$get();
  return res.ok ? await res.json() : [];
});

export const getPost = cache(async (slug: string) => {
  const res = await client.api.blog[":slug"].$get({ param: { slug } });
  return res.ok ? await res.json() : null;
});

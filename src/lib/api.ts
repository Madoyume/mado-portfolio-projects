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

export const getPhotos = cache(async () => {
  const res = await client.api.photos.$get();
  return res.ok ? await res.json() : [];
});

export const getPosts = cache(async (tag?: string) => {
  const res = await client.api.blog.$get({ query: tag ? { tag } : {} });
  return res.ok ? await res.json() : { items: [], nextCursor: null };
});

export const getPost = cache(async (slug: string) => {
  const res = await client.api.blog[":slug"].$get({ param: { slug } });
  return res.ok ? await res.json() : null;
});

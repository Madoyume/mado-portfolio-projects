import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "./env";
import { PHOTOS_FOLDER } from "./photo";

function configure() {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

type UploadOptions = {
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
};

export async function uploadImage(file: File, options: UploadOptions = {}) {
  const c = configure();
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const res = await c.uploader.upload(dataUri, {
    folder: options.folder,
    public_id: options.publicId,
    overwrite: options.overwrite,
    resource_type: "image",
  });
  return {
    publicId: res.public_id,
    url: res.secure_url,
    width: res.width,
    height: res.height,
  };
}

export async function deleteImage(publicId: string) {
  const c = configure();
  await c.uploader.destroy(publicId, { resource_type: "image" });
}

export type BlogImage = {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  createdAt: string | null;
};

export async function listImages(folder: string): Promise<BlogImage[]> {
  const c = configure();
  const prefix = folder.endsWith("/") ? folder : `${folder}/`;
  const res = await c.api.resources({
    type: "upload",
    prefix,
    max_results: 100,
  });
  return (res.resources ?? []).map(
    (r: {
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
      created_at?: string;
    }) => ({
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width ?? null,
      height: r.height ?? null,
      createdAt: r.created_at ?? null,
    }),
  );
}

export function imageUrl(publicId: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return cloud
    ? `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`
    : null;
}

const ALLOWED_FOLDERS = [PHOTOS_FOLDER, "mado/social", "mado/blog"];
const ALLOWED_PUBLIC_IDS = ["mado/hero", "mado/avatar"];
const BLOG_SLUG_FOLDER = /^mado\/blog\/[a-z0-9-]+$/;

function isFolderAllowed(folder: string) {
  return ALLOWED_FOLDERS.includes(folder) || BLOG_SLUG_FOLDER.test(folder);
}

export function signUpload(params: { folder?: string; publicId?: string }) {
  const env = getCloudinaryEnv();
  if (params.folder && !isFolderAllowed(params.folder)) {
    throw new Error("folder not allowed");
  }
  if (params.publicId && !ALLOWED_PUBLIC_IDS.includes(params.publicId)) {
    throw new Error("public_id not allowed");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign: Record<string, string | number> = { timestamp };
  if (params.folder) toSign.folder = params.folder;
  if (params.publicId) toSign.public_id = params.publicId;

  const signature = cloudinary.utils.api_sign_request(
    toSign,
    env.CLOUDINARY_API_SECRET,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder: params.folder,
    publicId: params.publicId,
  };
}

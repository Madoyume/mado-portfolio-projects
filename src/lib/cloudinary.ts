import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "./env";

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

export function imageUrl(publicId: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return cloud
    ? `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`
    : null;
}

const ALLOWED_FOLDERS = ["mado/photos", "mado/social"];
const ALLOWED_PUBLIC_IDS = ["mado/hero", "mado/avatar"];

export function signUpload(params: { folder?: string; publicId?: string }) {
  const env = getCloudinaryEnv();
  if (params.folder && !ALLOWED_FOLDERS.includes(params.folder)) {
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

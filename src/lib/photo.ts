import { PHOTOS_FOLDER } from "./constants";

export function toPhotoId(publicId: string) {
  return publicId.replace(`${PHOTOS_FOLDER}/`, "");
}

export function photoPublicId(id: string) {
  return `${PHOTOS_FOLDER}/${id}`;
}

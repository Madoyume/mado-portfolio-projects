export function stripFolder(publicId: string, folder: string) {
  return publicId.replace(`${folder}/`, "");
}

export function withFolder(id: string, folder: string) {
  return `${folder}/${id}`;
}

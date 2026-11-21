export function normalizeTagName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function displayTagName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

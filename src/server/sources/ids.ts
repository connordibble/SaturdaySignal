export function createSourceDocumentId(parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

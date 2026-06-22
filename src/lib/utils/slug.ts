// Turn a display name into a URL-friendly slug.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Append a short random suffix to keep slugs unique.
export function uniqueSlug(input: string): string {
  const base = slugify(input) || "workspace";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/** Normalized key for duplicate checks (per household / per category). */
export function categoryNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

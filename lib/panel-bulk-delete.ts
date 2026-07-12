export const BULK_DELETE_CHUNK_SIZE = 50;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BulkDeleteActionResult =
  | { ok: true; deletedCount?: number }
  | { ok: false; error: string; deletedCount?: number };

export function normalizeBulkDeleteIds(ids: string[]): string[] {
  return Array.from(
    new Set(
      ids
        .filter((id) => typeof id === "string" && id.trim())
        .map((id) => id.trim()),
    ),
  ).filter((id) => UUID_PATTERN.test(id));
}

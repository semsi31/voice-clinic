import { revalidatePath } from "next/cache";
import {
  BULK_DELETE_CHUNK_SIZE,
  normalizeBulkDeleteIds,
  type BulkDeleteActionResult,
} from "@/lib/panel-bulk-delete";

type ChunkDeleteClient = {
  from: (table: string) => unknown;
};

type ChunkDeleteQuery = {
  delete: () => {
    in: (
      column: string,
      values: string[],
    ) => {
      select: (columns: string) => PromiseLike<{
        data: { id: string }[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

export async function deleteRecordsInChunks(
  supabase: ChunkDeleteClient,
  table: string,
  ids: string[],
  paths: string[],
  errorLabel: string,
): Promise<BulkDeleteActionResult> {
  const validIds = normalizeBulkDeleteIds(ids);

  if (validIds.length === 0) {
    return { ok: false, error: "Silinecek kayıt seçilmedi." };
  }

  let deletedCount = 0;

  for (let index = 0; index < validIds.length; index += BULK_DELETE_CHUNK_SIZE) {
    const chunk = validIds.slice(index, index + BULK_DELETE_CHUNK_SIZE);
    const chunkNumber = Math.floor(index / BULK_DELETE_CHUNK_SIZE) + 1;

    const deleteQuery = supabase.from(table) as ChunkDeleteQuery;
    const { data, error } = await deleteQuery
      .delete()
      .in("id", chunk)
      .select("id");

    if (error) {
      console.error(`Bulk ${table} delete failed`, {
        chunkNumber,
        chunkSize: chunk.length,
        error,
      });

      if (deletedCount > 0) {
        for (const path of paths) {
          revalidatePath(path);
        }
      }

      return {
        ok: false,
        deletedCount,
        error: `${chunkNumber}. parçada ${errorLabel}: ${error.message}`,
      };
    }

    deletedCount += data?.length ?? chunk.length;
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return { ok: true, deletedCount };
}

export async function deleteRecordsSequentially(
  ids: string[],
  deleteOne: (id: string) => Promise<BulkDeleteActionResult>,
  errorLabel: string,
): Promise<BulkDeleteActionResult> {
  const validIds = normalizeBulkDeleteIds(ids);

  if (validIds.length === 0) {
    return { ok: false, error: "Silinecek kayıt seçilmedi." };
  }

  let deletedCount = 0;

  for (const id of validIds) {
    const result = await deleteOne(id);

    if (!result.ok) {
      return {
        ok: false,
        deletedCount,
        error: `${errorLabel}: ${result.error}`,
      };
    }

    deletedCount += result.deletedCount ?? 1;
  }

  return { ok: true, deletedCount };
}

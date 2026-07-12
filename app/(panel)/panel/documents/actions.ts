"use server";

import { revalidatePath } from "next/cache";
import { deleteRecordsSequentially } from "@/lib/supabase-bulk-delete";
import {
  formatFileSize,
  inferFileTypeFromFilename,
  sanitizeStorageFileName,
} from "@/lib/documents";
import { extractFormValues } from "@/lib/panel-form";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import {
  buildDocumentR2Key,
  createR2SignedDownloadUrl,
  deleteFileFromR2,
  uploadFileToR2,
} from "@/lib/r2-storage";
import { optionalText, readText } from "@/lib/transactions";

export type DocumentFormValues = {
  title: string;
  description: string;
};

const documentFormFields = ["title", "description"] as const;

export type DocumentActionResult =
  | { ok: true }
  | { ok: false; error: string; values?: DocumentFormValues };

export type DocumentDownloadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_DOCUMENT_FILE_SIZE = 50 * 1024 * 1024;

function documentFormError(
  formData: FormData,
  error: string,
): { ok: false; error: string; values: DocumentFormValues } {
  return {
    ok: false,
    error,
    values: extractFormValues(formData, [...documentFormFields]) as DocumentFormValues,
  };
}

function readFile(formData: FormData): File | null {
  const value = formData.get("file");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

async function uploadDocumentFile(
  file: File,
) {
  const safeName = sanitizeStorageFileName(file.name || "belge");
  const r2Key = buildDocumentR2Key(safeName || "belge");
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadFileToR2({
      key: r2Key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
    });
  } catch (error) {
    console.error("R2 document upload failed", { key: r2Key, error });
    return { ok: false as const, error: "Dosya yüklenemedi." };
  }

  return {
    ok: true as const,
    data: {
      file_path: r2Key,
      file_type: inferFileTypeFromFilename(file.name),
      file_size: formatFileSize(file.size),
    },
  };
}

async function removeDocumentFile(filePath: string | null) {
  if (!filePath) {
    return { ok: true as const };
  }

  try {
    await deleteFileFromR2(filePath);
    return { ok: true as const };
  } catch (error) {
    console.error("R2 document delete failed", { key: filePath, error });
    return { ok: false as const, error: "Dosya silinemedi." };
  }
}

export async function createDocumentAction(
  _prevState: DocumentActionResult | undefined,
  formData: FormData,
): Promise<DocumentActionResult | undefined> {
  const title = readText(formData.get("title"));
  const file = readFile(formData);

  if (!title) {
    return documentFormError(formData, "Belge adı zorunludur.");
  }

  if (!file) {
    return documentFormError(formData, "Dosya seçilmelidir.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return documentFormError(formData, "Dosya yüklenemedi.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return documentFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, userId } = auth;
  const uploadResult = await uploadDocumentFile(file);

  if (!uploadResult.ok) {
    return documentFormError(formData, uploadResult.error);
  }

  const { error } = await supabase.from("documents").insert({
    title,
    description: optionalText(formData.get("description")),
    file_name: file.name || null,
    file_path: uploadResult.data.file_path,
    file_type: uploadResult.data.file_type,
    file_size: uploadResult.data.file_size,
    created_by: userId,
  });

  if (error) {
    await removeDocumentFile(uploadResult.data.file_path);
    return documentFormError(formData, "Belge kaydı oluşturulamadı.");
  }

  revalidatePath("/panel/documents");
  return { ok: true };
}

export async function updateDocumentAction(
  _prevState: DocumentActionResult | undefined,
  formData: FormData,
): Promise<DocumentActionResult | undefined> {
  const id = readText(formData.get("id"));
  const title = readText(formData.get("title"));

  if (!id) {
    return documentFormError(formData, "Kayıt kimliği bulunamadı.");
  }

  if (!title) {
    return documentFormError(formData, "Belge adı zorunludur.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return documentFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase } = auth;
  const { error } = await supabase
    .from("documents")
    .update({
      title,
      description: optionalText(formData.get("description")),
    })
    .eq("id", id);

  if (error) {
    return documentFormError(formData, "Belge güncellenemedi.");
  }

  revalidatePath("/panel/documents");
  return { ok: true };
}

export async function deleteDocumentAction(
  id: string,
): Promise<DocumentActionResult> {
  if (!id) {
    return { ok: false, error: "Kayıt kimliği bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError || !document) {
    return { ok: false, error: "Belge bulunamadı." };
  }

  const removeResult = await removeDocumentFile(document.file_path);
  if (!removeResult.ok) {
    return removeResult;
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Belge silinemedi." };
  }

  revalidatePath("/panel/documents");
  return { ok: true };
}

export async function deleteDocumentRecords(
  ids: string[],
): Promise<DocumentActionResult> {
  try {
    await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  return deleteRecordsSequentially(
    ids,
    deleteDocumentAction,
    "belgeler silinemedi",
  );
}

export async function getDocumentDownloadUrlAction(
  id: string,
): Promise<DocumentDownloadResult> {
  if (!id) {
    return { ok: false, error: "Kayıt kimliği bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("file_path, title")
    .eq("id", id)
    .single();

  if (fetchError || !document?.file_path) {
    return { ok: false, error: "İndirilebilir dosya bulunamadı." };
  }

  try {
    const url = await createR2SignedDownloadUrl(document.file_path, 300);
    return { ok: true, url };
  } catch (error) {
    console.error("R2 document signed URL failed", {
      key: document.file_path,
      error,
    });
    return { ok: false, error: "Dosya bağlantısı oluşturulamadı." };
  }
}

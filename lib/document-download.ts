import "server-only";

import type { DocumentFileType } from "@/lib/documents";
import { requireActivePanelUser } from "@/lib/panel-auth";
import { getR2Object, r2ObjectExists } from "@/lib/r2-storage";

const contentTypeByFileType: Record<DocumentFileType, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  other: "application/octet-stream",
};

function sanitizeDownloadFilename(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").trim() || "belge";
}

function resolveDownloadFilename(input: {
  title: string;
  file_name: string | null;
  file_type: DocumentFileType;
}) {
  const preferred = input.file_name?.trim() || input.title.trim() || "belge";
  const sanitized = sanitizeDownloadFilename(preferred);

  if (/\.[a-z0-9]+$/i.test(sanitized) || input.file_type === "other") {
    return sanitized;
  }

  const extension =
    input.file_type === "jpeg" ? "jpg" : input.file_type;
  return `${sanitized}.${extension}`;
}

export async function loadAuthorizedDocumentForDownload(documentId: string) {
  if (!documentId) {
    return { ok: false as const, status: 400, error: "Kayıt kimliği bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch {
    return { ok: false as const, status: 401, error: "Bu işlem için yetkiniz yok." };
  }

  const { supabase } = auth;
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, file_name, file_path, file_type")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !document?.file_path) {
    return {
      ok: false as const,
      status: 404,
      error: "İndirilebilir dosya bulunamadı.",
    };
  }

  try {
    const exists = await r2ObjectExists(document.file_path);
    if (!exists) {
      console.error("Document download missing R2 object", {
        documentId: document.id,
        keySuffix: document.file_path.slice(-24),
      });
      return {
        ok: false as const,
        status: 404,
        error: "Dosya depoda bulunamadı.",
      };
    }
  } catch (storageError) {
    console.error("Document download R2 head failed", {
      documentId: document.id,
      error: storageError,
    });
    return {
      ok: false as const,
      status: 500,
      error: "Dosya bağlantısı oluşturulamadı.",
    };
  }

  return {
    ok: true as const,
    document,
    downloadFilename: resolveDownloadFilename({
      title: document.title,
      file_name: document.file_name,
      file_type: document.file_type as DocumentFileType,
    }),
  };
}

export async function createDocumentDownloadResponse(documentId: string) {
  const loaded = await loadAuthorizedDocumentForDownload(documentId);
  if (!loaded.ok) {
    return Response.json({ error: loaded.error }, { status: loaded.status });
  }

  try {
    const object = await getR2Object(loaded.document.file_path);
    const body = object.Body;

    if (!body) {
      return Response.json(
        { error: "Dosya depoda bulunamadı." },
        { status: 404 },
      );
    }

    const contentType =
      object.ContentType ??
      contentTypeByFileType[loaded.document.file_type as DocumentFileType] ??
      "application/octet-stream";

    const encodedFilename = encodeURIComponent(loaded.downloadFilename);

    return new Response(body.transformToWebStream(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${loaded.downloadFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, no-store",
        ...(object.ContentLength
          ? { "Content-Length": String(object.ContentLength) }
          : {}),
      },
    });
  } catch (error) {
    console.error("Document download R2 get failed", {
      documentId: loaded.document.id,
      error,
    });
    return Response.json(
      { error: "Dosya indirilemedi." },
      { status: 500 },
    );
  }
}

export function getDocumentDownloadPath(documentId: string) {
  return `/api/panel/documents/${documentId}/download`;
}
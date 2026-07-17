export type DocumentFileType =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "png"
  | "jpg"
  | "jpeg"
  | "other";

export type DocumentRecord = {
  id: string;
  title: string;
  file_type: DocumentFileType;
  file_size: string | null;
  file_name: string | null;
  file_path: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const documentFileTypeLabels: Record<DocumentFileType, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPEG",
  other: "Diğer",
};

export const documentFileTypeFilterOptions: {
  value: "all" | DocumentFileType;
  label: string;
}[] = [
  { value: "all", label: "Tümü" },
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "DOC" },
  { value: "docx", label: "DOCX" },
  { value: "xls", label: "XLS" },
  { value: "xlsx", label: "XLSX" },
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "jpeg", label: "JPEG" },
  { value: "other", label: "Diğer" },
];

export const documentFileTypeBadgeClassNames: Record<DocumentFileType, string> =
  {
    pdf: "border-rose-200 bg-rose-50 text-rose-700",
    doc: "border-sky-200 bg-sky-50 text-sky-700",
    docx: "border-sky-200 bg-sky-50 text-sky-700",
    xls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    xlsx: "border-emerald-200 bg-emerald-50 text-emerald-700",
    jpg: "border-violet-200 bg-violet-50 text-violet-700",
    jpeg: "border-violet-200 bg-violet-50 text-violet-700",
    png: "border-violet-200 bg-violet-50 text-violet-700",
    other: "border-slate-200 bg-slate-100 text-slate-700",
  };

const extensionToFileType: Record<string, DocumentFileType> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xls: "xls",
  xlsx: "xlsx",
  png: "png",
  jpg: "jpg",
  jpeg: "jpeg",
};

export function inferFileTypeFromFilename(filename: string): DocumentFileType {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return extensionToFileType[extension] ?? "other";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCurrentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

export function summarizeDocuments(documents: DocumentRecord[]) {
  const { start, end } = getCurrentMonthBounds();

  const monthlyUploads = documents.filter((document) => {
    const createdAt = new Date(document.created_at);
    return createdAt >= start && createdAt <= end;
  }).length;

  const pdfCount = documents.filter(
    (document) => document.file_type === "pdf",
  ).length;

  return {
    total: documents.length,
    monthlyUploads,
    pdfCount,
    otherCount: documents.length - pdfCount,
  };
}

export function sanitizeStorageFileName(filename: string) {
  return filename
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function getDocumentDownloadPath(documentId: string) {
  return `/api/panel/documents/${documentId}/download`;
}

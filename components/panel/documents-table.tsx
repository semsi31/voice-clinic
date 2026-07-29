"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Download, FileSearch, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createDocumentAction,
  deleteDocumentAction,
  deleteDocumentRecords,
  updateDocumentAction,
  type DocumentActionResult,
} from "@/app/(panel)/panel/documents/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import { PanelPendingSubmitButton } from "@/components/panel/panel-pending-submit-button";
import {
  panelFilterFieldClassName,
  panelFilterGridClassName,
  panelFilterInputClassName,
  panelFilterLabelClassName,
  panelFilterSelectClassName,
  panelMobileCardClassName,
  panelMobileCardListClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableActionsCellClassName,
  panelTableRowClassName,
  panelTableActionsHeadClassName,
  panelTableCellClassName,
  panelTableClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
  panelTableDesktopClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import {
  documentFileTypeBadgeClassNames,
  documentFileTypeFilterOptions,
  documentFileTypeLabels,
  getDocumentDownloadPath,
  type DocumentFileType,
  type DocumentRecord,
} from "@/lib/documents";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";
import { formatDate } from "@/lib/transactions";

const fileInputClassName =
  "block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200";
const acceptedDocumentExtensions = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

function FileTypeBadge({ fileType }: Readonly<{ fileType: DocumentFileType }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${documentFileTypeBadgeClassNames[fileType]}`}
    >
      {documentFileTypeLabels[fileType]}
    </span>
  );
}

type UploadDocumentFormProps = {
  onClose: () => void;
};

function UploadDocumentForm({ onClose }: UploadDocumentFormProps) {
  const [state, formAction] = useActionState<
    DocumentActionResult | undefined,
    FormData
  >(createDocumentAction, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [onClose, state]);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormField label="Belge adı">
          <input
            type="text"
            name="title"
            className={formInputClassName}
            defaultValue={values?.title ?? ""}
            placeholder="Örn. KVKK Aydınlatma Metni"
            required
          />
        </FormField>
      </div>

      <div className="sm:col-span-2">
        <FormField label="Dosya seç">
          <input
            type="file"
            name="file"
            accept={acceptedDocumentExtensions}
            className={fileInputClassName}
            required
          />
        </FormField>
      </div>

      <div className="sm:col-span-2">
        <FormField label="Açıklama">
          <textarea
            name="description"
            className={formTextareaClassName}
            defaultValue={values?.description ?? ""}
            placeholder="Belge hakkında kısa not ekleyin."
          />
        </FormField>
      </div>

      {state && !state.ok ? (
        <p className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
        >
          İptal
        </button>
        <PanelPendingSubmitButton
          className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          idleLabel="Belgeyi Kaydet"
          pendingLabel="Yükleniyor..."
        />
      </div>
    </form>
  );
}

type EditDocumentFormProps = {
  document: DocumentRecord;
  onClose: () => void;
};

function EditDocumentForm({ document, onClose }: EditDocumentFormProps) {
  const [state, formAction] = useActionState<
    DocumentActionResult | undefined,
    FormData
  >(updateDocumentAction, undefined);
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [onClose, state]);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={document.id} />

      <FormField label="Belge adı">
        <input
          type="text"
          name="title"
          className={formInputClassName}
          defaultValue={values?.title ?? document.title}
          required
        />
      </FormField>

      <FormField label="Açıklama">
        <textarea
          name="description"
          className={formTextareaClassName}
          defaultValue={values?.description ?? document.description ?? ""}
        />
      </FormField>

      {state && !state.ok ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
        >
          İptal
        </button>
        <PanelPendingSubmitButton
          className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          idleLabel="Değişiklikleri Kaydet"
          pendingLabel="Kaydediliyor..."
        />
      </div>
    </form>
  );
}

function DownloadDocumentButton({
  document,
}: Readonly<{ document: DocumentRecord }>) {
  if (!document.file_path) {
    return (
      <button
        type="button"
        className={rowActionButtonClassName}
        aria-label="İndir"
        title="Dosya yolu yok"
        disabled
      >
        <Download className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <a
      href={getDocumentDownloadPath(document.id)}
      className={rowActionButtonClassName}
      aria-label="İndir"
      title="İndir"
      download
    >
      <Download className="size-4" aria-hidden="true" />
    </a>
  );
}

function DeleteDocumentButton({
  document,
  onDeleted,
}: Readonly<{ document: DocumentRecord; onDeleted: (ids: string[]) => void }>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteDocumentAction(document.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([document.id]);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className={`${rowActionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
        aria-label="Sil"
        title="Sil"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <ActionModal
          title="Belgeyi Sil"
          description="Bu belge ve dosyası kalıcı olarak silinecek."
          onClose={() => setIsOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{document.title}</strong> belgesini silmek istediğinizden
              emin misiniz?
            </p>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isPending ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}
    </>
  );
}

export function DocumentsTable({
  documents,
}: Readonly<{ documents: DocumentRecord[] }>) {
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<"all" | DocumentFileType>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentRecord | null>(null);
  const {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(documents);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return visibleRecords.filter((document) => {
      const searchableText = [document.title, document.description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesType =
        fileType === "all" || document.file_type === fileType;

      return matchesSearch && matchesType;
    });
  }, [fileType, search, visibleRecords]);

  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredDocuments);

  return (
    <>
      <PanelCard
        title="Belge Listesi"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BulkDeleteRecordsButton
              selectedCount={selectedRecords.length}
              title="Seçili Belgeleri Sil"
              description="Bu işlem seçili belgeleri ve dosyalarını kalıcı olarak silecek."
              confirmMessage={
                <p className="text-sm leading-6 text-slate-700">
                  <strong>{selectedRecords.length}</strong> belgeyi silmek
                  istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              }
              preview={
                <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <ul className="space-y-1">
                    {selectedRecords.slice(0, 10).map((document) => (
                      <li key={document.id} className="truncate">
                        {document.title}
                      </li>
                    ))}
                  </ul>
                  {selectedRecords.length > 10 ? (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      ve {selectedRecords.length - 10} kayıt daha...
                    </p>
                  ) : null}
                </div>
              }
              errorPrefix="Belgeler silinemedi"
              successLabel="belge silindi."
              selectedIds={selectedRecords.map((record) => record.id)}
              onDeleted={handleRecordsDeleted}
              onDelete={() =>
                deleteDocumentRecords(selectedRecords.map((record) => record.id))
              }
            />
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Belge Yükle
            </button>
          </div>
        }
      >
        <div className={`${panelFilterGridClassName} lg:grid-cols-2`}>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ara</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="size-4" aria-hidden="true" />
              </span>
              <input
                type="search"
                placeholder="Belge adı veya açıklama"
                className={`${panelFilterInputClassName} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Dosya Türü</span>
            <select
              className={panelFilterSelectClassName}
              value={fileType}
              onChange={(event) =>
                setFileType(event.target.value as "all" | DocumentFileType)
              }
            >
              {documentFileTypeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredDocuments.length > 0 ? (
          <>
            <div className={panelMobileCardListClassName}>
              {filteredDocuments.map((document) => (
                <article
                  key={`mobile-${document.id}`}
                  className={panelMobileCardClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-950">
                        {document.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(document.created_at)}
                      </p>
                    </div>
                    <FileTypeBadge fileType={document.file_type} />
                  </div>
                  {document.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {document.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DownloadDocumentButton document={document} />
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label="Düzenle"
                      title="Düzenle"
                      onClick={() => setEditDocument(document)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <DeleteDocumentButton
                      document={document}
                      onDeleted={handleRecordsDeleted}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className={`${panelTableScrollClassName} ${panelTableDesktopClassName}`}>
            <table className={panelTableClassName}>
              <thead>
                <tr className={panelTableHeadRowClassName}>
                  <th className={`${panelTableHeadClassName} w-10`}>
                    <TableSelectAllCheckbox
                      allSelected={allFilteredSelected}
                      someSelected={someFilteredSelected}
                      onToggle={toggleFilteredSelection}
                    />
                  </th>
                  <th className={panelTableHeadClassName}>
                    Belge Adı
                  </th>
                  <th className={`${panelTableHeadClassName} w-[7rem]`}>
                    Dosya Türü
                  </th>
                  <th className={`${panelTableHeadClassName} w-[6.5rem] whitespace-nowrap`}>
                    Boyut
                  </th>
                  <th className={`${panelTableHeadClassName} w-[7rem]`}>
                    Tarih
                  </th>
                  <th className={`${panelTableHeadClassName} hidden xl:table-cell`}>
                    Açıklama
                  </th>
                  <th className={panelTableActionsHeadClassName}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr
                    key={document.id}
                    className={panelTableRowClassName}
                  >
                    <td className={panelTableCellClassName}>
                      <TableRowCheckbox
                        checked={selectedIds.has(document.id)}
                        label={`${document.title} belgesini seç`}
                        onToggle={() => toggleRecordSelection(document.id)}
                      />
                    </td>
                    <td
                      className={`${panelTableCellClassName} min-w-0 truncate font-semibold text-slate-950`}
                      title={document.title}
                    >
                      {document.title}
                    </td>
                    <td className={panelTableCellClassName}>
                      <FileTypeBadge fileType={document.file_type} />
                    </td>
                    <td className={`${panelTableCellClassName} whitespace-nowrap`}>
                      {document.file_size || "-"}
                    </td>
                    <td className={`${panelTableCellClassName} whitespace-nowrap`}>
                      {formatDate(document.created_at)}
                    </td>
                    <td
                      className={`${panelTableCellClassName} hidden min-w-0 truncate xl:table-cell`}
                      title={document.description || undefined}
                    >
                      {document.description || "-"}
                    </td>
                    <td className={panelTableActionsCellClassName}>
                      <div className="flex shrink-0 items-center justify-end gap-1.5">
                        <DownloadDocumentButton document={document} />
                        <button
                          type="button"
                          className={rowActionButtonClassName}
                          aria-label="Düzenle"
                          title="Düzenle"
                          onClick={() => setEditDocument(document)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <DeleteDocumentButton
                          document={document}
                          onDeleted={handleRecordsDeleted}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <EmptyState
            icon={FileSearch}
            title="Belge bulunamadı"
            description="Seçili filtrelerle eşleşen belge kaydı yok."
          />
        )}
      </PanelCard>

      {isUploadOpen ? (
        <ActionModal
          title="Belge Yükle"
          description="Hazır belge arşivine yeni dosya ekleyin."
          onClose={() => setIsUploadOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <UploadDocumentForm onClose={() => setIsUploadOpen(false)} />
        </ActionModal>
      ) : null}

      {editDocument ? (
        <ActionModal
          title="Belgeyi Düzenle"
          description="Belge bilgilerini güncelleyin."
          onClose={() => setEditDocument(null)}
          showPrimary={false}
          showFooter={false}
        >
          <EditDocumentForm
            document={editDocument}
            onClose={() => setEditDocument(null)}
          />
        </ActionModal>
      ) : null}
    </>
  );
}

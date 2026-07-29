"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ActionModal } from "@/components/panel/action-modal";
import {
  panelSecondaryButtonClassName,
} from "@/components/panel/panel-styles";
import type { BulkDeleteActionResult } from "@/lib/panel-bulk-delete";

export const tableCheckboxClassName =
  "size-5 min-h-5 min-w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200";

export function useTableBulkSelection<T extends { id: string }>(records: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(
    new Set(),
  );

  const visibleRecords = useMemo(
    () => records.filter((record) => !locallyDeletedIds.has(record.id)),
    [locallyDeletedIds, records],
  );

  const selectedRecords = useMemo(
    () => visibleRecords.filter((record) => selectedIds.has(record.id)),
    [selectedIds, visibleRecords],
  );

  const handleRecordsDeleted = (ids: string[]) => {
    setLocallyDeletedIds((current) => new Set([...current, ...ids]));
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleRecordSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const createSelectionState = (filteredRecords: T[]) => {
    const filteredIds = filteredRecords.map((record) => record.id);
    const allFilteredSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
    const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

    const toggleFilteredSelection = () => {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (allFilteredSelected) {
          for (const id of filteredIds) {
            next.delete(id);
          }
        } else {
          for (const id of filteredIds) {
            next.add(id);
          }
        }
        return next;
      });
    };

    return {
      filteredIds,
      allFilteredSelected,
      someFilteredSelected,
      toggleFilteredSelection,
    };
  };

  return {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  };
}

type TableSelectAllCheckboxProps = {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
};

export function TableSelectAllCheckbox({
  allSelected,
  someSelected,
  onToggle,
  label = "Filtrelenen kayıtları seç",
  disabled = false,
}: Readonly<TableSelectAllCheckboxProps>) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={allSelected}
      disabled={disabled}
      ref={(input) => {
        if (input) {
          input.indeterminate = someSelected && !allSelected;
        }
      }}
      onChange={onToggle}
      className={`${tableCheckboxClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    />
  );
}

type TableRowCheckboxProps = {
  checked: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
};

export function TableRowCheckbox({
  checked,
  label,
  onToggle,
  disabled = false,
}: Readonly<TableRowCheckboxProps>) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={onToggle}
      className={`${tableCheckboxClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    />
  );
}

type BulkDeleteRecordsButtonProps = {
  selectedCount: number;
  title: string;
  description: string;
  confirmMessage: ReactNode;
  preview: ReactNode;
  errorPrefix: string;
  successLabel: string;
  onDelete: () => Promise<BulkDeleteActionResult>;
  onDeleted: (ids: string[]) => void;
  selectedIds: string[];
};

export function BulkDeleteRecordsButton({
  selectedCount,
  title,
  description,
  confirmMessage,
  preview,
  errorPrefix,
  successLabel,
  onDelete,
  onDeleted,
  selectedIds,
}: Readonly<BulkDeleteRecordsButtonProps>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await onDelete();

      if (!result.ok) {
        const partialMessage =
          result.deletedCount && result.deletedCount > 0
            ? ` ${result.deletedCount} kayıt silindi; liste yenileniyor.`
            : "";
        setError(`${errorPrefix}: ${result.error}${partialMessage}`);
        if (result.deletedCount && result.deletedCount > 0) {
          onDeleted(selectedIds.slice(0, result.deletedCount));
          router.refresh();
        }
        return;
      }

      setIsOpen(false);
      setSuccessMessage(
        `${result.deletedCount ?? selectedCount} ${successLabel}`,
      );
      onDeleted(selectedIds);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSuccessMessage(null);
          setIsOpen(true);
        }}
        disabled={selectedCount === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Seçilenleri Sil ({selectedCount})
      </button>
      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {isOpen ? (
        <ActionModal
          title={title}
          description={description}
          onClose={() => {
            if (!isPending) {
              setIsOpen(false);
            }
          }}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            {confirmMessage}
            {preview}
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
                {isPending ? "Siliniyor..." : "Seçilenleri Sil"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}
    </>
  );
}

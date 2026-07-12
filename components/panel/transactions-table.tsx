"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, FileSearch, Search, Trash2 } from "lucide-react";
import { ActionModal } from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import {
  panelFilterFieldClassName,
  panelFilterGridClassName,
  panelFilterInputClassName,
  panelFilterLabelClassName,
  panelFilterSelectClassName,
  panelMobileCardClassName,
  panelMobileCardLabelClassName,
  panelMobileCardListClassName,
  panelMobileCardValueClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableActionsCellClassName,
  panelTableActionsHeadClassName,
  panelTableDesktopClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import { deletePatientTransaction, deletePatientTransactions } from "@/app/(panel)/panel/transactions/actions";
import {
  formatCurrency,
  formatDate,
  type PatientTransactionRecord,
  type PaymentStatus,
} from "@/lib/transactions";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";

const tableHeadClassName =
  "border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap";

const tableCellClassName =
  "border-b border-slate-100 px-3 py-3 align-middle text-slate-700";

function deviceLabel(transaction: PatientTransactionRecord) {
  return [transaction.brand, transaction.model].filter(Boolean).join(" ") || "-";
}

function isLegacyTransaction(transaction: PatientTransactionRecord) {
  return transaction.source_type === "legacy_excel";
}

function LegacyBadge() {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800">
      Eski Excel Kaydı
    </span>
  );
}

type TransactionSourceFilter = "all" | "manual" | "legacy_excel";

type TransactionListFilters = {
  search: string;
  operation: string;
  paymentStatus: "all" | PaymentStatus;
  sourceType: TransactionSourceFilter;
  page: number;
};

function sourceFilterLabel(sourceType: TransactionSourceFilter) {
  if (sourceType === "legacy_excel") return "Eski Excel Kaydı";
  if (sourceType === "all") return "Tümü";
  return "Normal Kayıtlar";
}

function TransactionDeleteAction({
  transaction,
  onDeleted,
}: Readonly<{
  transaction: PatientTransactionRecord;
  onDeleted: (ids: string[]) => void;
}>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deletePatientTransaction(transaction.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([transaction.id]);
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
          title="İşlemi Sil"
          description="Bu işlem silinecek. İşleme bağlı stok düşümü varsa stok geri iade edilir."
          onClose={() => {
            if (!isPending) setIsOpen(false);
          }}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              {transaction.patient_name} adına kayıtlı{" "}
              <strong>{transaction.transaction_no ?? "işlem"}</strong> kaydını
              silmek istediğinizden emin misiniz?
            </p>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                onClick={handleDelete}
                disabled={isPending}
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

export function TransactionsTable({
  transactions,
  filters,
  totalCount,
  pageSize,
}: Readonly<{
  transactions: PatientTransactionRecord[];
  filters: TransactionListFilters;
  totalCount: number;
  pageSize: number;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search);
  const [operation, setOperation] = useState(filters.operation);
  const [paymentStatus, setPaymentStatus] = useState(filters.paymentStatus);
  const [sourceType, setSourceType] = useState(filters.sourceType);
  const {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(transactions);

  const filteredTransactions = visibleRecords;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const firstVisibleIndex =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleIndex = Math.min(currentPage * pageSize, totalCount);

  const buildTransactionsHref = useCallback(({
    nextSearch,
    nextOperation,
    nextPaymentStatus,
    nextSourceType,
    nextPage = 1,
  }: {
    nextSearch?: string;
    nextOperation?: string;
    nextPaymentStatus?: "all" | PaymentStatus;
    nextSourceType?: TransactionSourceFilter;
    nextPage?: number;
  } = {}) => {
    const params = new URLSearchParams();
    const resolvedSearch = nextSearch ?? search;
    const resolvedOperation = nextOperation ?? operation;
    const resolvedPaymentStatus = nextPaymentStatus ?? paymentStatus;
    const resolvedSourceType = nextSourceType ?? sourceType;

    const trimmedSearch = resolvedSearch.trim();
    const trimmedOperation = resolvedOperation.trim();

    if (trimmedSearch) params.set("search", trimmedSearch);
    if (trimmedOperation) params.set("operation", trimmedOperation);
    if (resolvedPaymentStatus !== "all") {
      params.set("paymentStatus", resolvedPaymentStatus);
    }
    if (resolvedSourceType !== "manual") {
      params.set("source", resolvedSourceType);
    }
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [operation, pathname, paymentStatus, search, sourceType]);

  const applyFilters = useCallback((nextFilters?: Parameters<typeof buildTransactionsHref>[0]) => {
    router.push(buildTransactionsHref(nextFilters));
  }, [buildTransactionsHref, router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === filters.search && operation === filters.operation) {
        return;
      }

      applyFilters({ nextSearch: search, nextOperation: operation });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [applyFilters, filters.operation, filters.search, operation, search]);

  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredTransactions);

  return (
    <PanelCard
      title="İşlem Listesi"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BulkDeleteRecordsButton
              selectedCount={selectedRecords.length}
              title="Seçili İşlemleri Sil"
              description="Bu işlem seçili hasta işlemlerini kalıcı olarak silecek. Bağlı stok düşümleri geri iade edilir."
              confirmMessage={
                <p className="text-sm leading-6 text-slate-700">
                  <strong>{selectedRecords.length}</strong> işlem kaydını silmek
                  istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              }
              preview={
                <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <ul className="space-y-1">
                    {selectedRecords.slice(0, 10).map((transaction) => (
                      <li key={transaction.id} className="truncate">
                        {transaction.transaction_no ?? transaction.id} -{" "}
                        {transaction.patient_name}
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
              errorPrefix="İşlem kayıtları silinemedi"
              successLabel="işlem kaydı silindi."
              selectedIds={selectedRecords.map((record) => record.id)}
              onDeleted={handleRecordsDeleted}
              onDelete={() =>
                deletePatientTransactions(
                  selectedRecords.map((record) => record.id),
                )
              }
            />
            <Link
            href="/panel/transactions/new"
            className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          >
            Yeni İşlem
          </Link>
        </div>
      }
    >
      <div className={`${panelFilterGridClassName} lg:grid-cols-5`}>
        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Ara</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="size-4" aria-hidden="true" />
            </span>
            <input
              type="search"
              placeholder="Hasta, gönderen, işlem veya not"
              className={`${panelFilterInputClassName} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Yapılan İşlem</span>
          <input
            type="search"
            placeholder="Örn. cihaz satışı, tamir, kontrol"
            className={panelFilterInputClassName}
            value={operation}
            onChange={(event) => setOperation(event.target.value)}
          />
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Borç Durumu</span>
          <select
            className={panelFilterSelectClassName}
            value={paymentStatus}
            onChange={(event) => {
              const value = event.target.value as "all" | PaymentStatus;
              setPaymentStatus(value);
              applyFilters({ nextPaymentStatus: value });
            }}
          >
            <option value="all">Tümü</option>
            <option value="paid">Ödendi</option>
            <option value="partial">Kısmi Ödendi</option>
            <option value="unpaid">Borçlu</option>
          </select>
        </label>

        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Kaynak</span>
          <select
            className={panelFilterSelectClassName}
            value={sourceType}
            onChange={(event) => {
              const value = event.target.value as TransactionSourceFilter;
              setSourceType(value);
              applyFilters({ nextSourceType: value });
            }}
          >
            <option value="all">Tümü</option>
            <option value="manual">Normal Kayıtlar</option>
            <option value="legacy_excel">Eski Excel Kaydı</option>
          </select>
        </label>

        <div className="flex items-end">
          <Link
            href="/panel/transactions"
            className={`${panelSecondaryButtonClassName} h-10 px-4 py-2`}
          >
            Sıfırla
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Kaynak:{" "}
          <strong className="text-slate-900">
            {sourceFilterLabel(filters.sourceType)}
          </strong>
          {" · "}
          {totalCount > 0
            ? `${firstVisibleIndex}-${lastVisibleIndex} / ${totalCount} kayıt`
            : "0 kayıt"}
        </p>
        {filters.sourceType === "manual" ? (
          <p className="font-medium text-slate-500">
            Varsayılan görünüm eski Excel kayıtlarını gizler.
          </p>
        ) : null}
      </div>

      {filteredTransactions.length > 0 ? (
        <>
          <div className={panelMobileCardListClassName}>
            {filteredTransactions.map((transaction) => (
              <article
                key={`mobile-${transaction.id}`}
                className={panelMobileCardClassName}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-bold text-slate-950">
                      {transaction.patient_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(transaction.transaction_date)}
                      {transaction.transaction_no
                        ? ` · ${transaction.transaction_no}`
                        : ""}
                    </p>
                  </div>
                  {isLegacyTransaction(transaction) ? (
                    <LegacyBadge />
                  ) : (
                    <StatusBadge status={transaction.payment_status} />
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <dt className={panelMobileCardLabelClassName}>Satış</dt>
                    <dd className={`${panelMobileCardValueClassName} tabular-nums`}>
                      {formatCurrency(transaction.sale_amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className={panelMobileCardLabelClassName}>Kalan Borç</dt>
                    <dd className={`${panelMobileCardValueClassName} tabular-nums`}>
                      {formatCurrency(transaction.remaining_debt)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={panelMobileCardLabelClassName}>İşlem</dt>
                    <dd className="text-sm text-slate-700">
                      {transaction.operation_description}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/panel/transactions/${transaction.id}`}
                    className={`${panelPrimaryButtonClassName} min-h-11 flex-1`}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    Detay
                  </Link>
                  <TransactionDeleteAction
                    transaction={transaction}
                    onDeleted={handleRecordsDeleted}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className={`${panelTableScrollClassName} ${panelTableDesktopClassName}`}>
          <table className="w-full min-w-[1240px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className={tableHeadClassName}>
                  <TableSelectAllCheckbox
                    allSelected={allFilteredSelected}
                    someSelected={someFilteredSelected}
                    onToggle={toggleFilteredSelection}
                  />
                </th>
                <th className={tableHeadClassName}>İşlem No</th>
                <th className={tableHeadClassName}>Tarih</th>
                <th className={tableHeadClassName}>Şube / Birim</th>
                <th className={tableHeadClassName}>Hasta Adı Soyadı</th>
                <th className={tableHeadClassName}>Kaynak</th>
                <th className={tableHeadClassName}>Telefon</th>
                <th className={tableHeadClassName}>Yapılan İşlem</th>
                <th className={tableHeadClassName}>Marka / Model</th>
                <th className={`${tableHeadClassName} text-right`}>
                  Satış Tutarı
                </th>
                <th className={`${tableHeadClassName} text-right`}>Ödenen</th>
                <th className={`${tableHeadClassName} text-right`}>
                  Kalan Borç
                </th>
                <th className={tableHeadClassName}>Durum</th>
                <th className={panelTableActionsHeadClassName}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                    className="group text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className={tableCellClassName}>
                      <TableRowCheckbox
                        checked={selectedIds.has(transaction.id)}
                        label={`${transaction.patient_name} işlemini seç`}
                        onToggle={() => toggleRecordSelection(transaction.id)}
                      />
                    </td>
                    <td
                    className={`${tableCellClassName} font-semibold whitespace-nowrap text-slate-950`}
                  >
                    {transaction.transaction_no ?? "-"}
                  </td>
                  <td className={`${tableCellClassName} whitespace-nowrap`}>
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className={tableCellClassName}>
                    {transaction.branch || "-"}
                  </td>
                  <td
                    className={`${tableCellClassName} font-semibold text-slate-950`}
                  >
                    {transaction.patient_name}
                  </td>
                  <td className={tableCellClassName}>
                    {isLegacyTransaction(transaction) ? <LegacyBadge /> : "-"}
                  </td>
                  <td className={`${tableCellClassName} whitespace-nowrap`}>
                    {transaction.patient_phone || "-"}
                  </td>
                  <td className={tableCellClassName}>
                    {transaction.operation_description}
                  </td>
                  <td className={`${tableCellClassName} max-w-[140px] truncate`}>
                    {isLegacyTransaction(transaction) ? "-" : deviceLabel(transaction)}
                  </td>
                  <td
                    className={`${tableCellClassName} text-right font-semibold tabular-nums text-slate-950`}
                  >
                    {formatCurrency(transaction.sale_amount)}
                  </td>
                  <td className={`${tableCellClassName} text-right tabular-nums`}>
                    {formatCurrency(transaction.paid_amount)}
                  </td>
                  <td
                    className={`${tableCellClassName} text-right font-semibold tabular-nums text-slate-950`}
                  >
                    {formatCurrency(transaction.remaining_debt)}
                  </td>
                  <td className={tableCellClassName}>
                    {isLegacyTransaction(transaction) ? (
                      <LegacyBadge />
                    ) : (
                      <StatusBadge status={transaction.payment_status} />
                    )}
                  </td>
                  <td className={panelTableActionsCellClassName}>
                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <Link
                        href={`/panel/transactions/${transaction.id}`}
                        className={rowActionButtonClassName}
                        aria-label="Görüntüle"
                        title="Görüntüle"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      <TransactionDeleteAction
                        transaction={transaction}
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
          title="İşlem kaydı bulunamadı"
          description="Seçili filtrelerle eşleşen hasta işlemi yok. Filtreleri temizleyerek tekrar deneyebilirsiniz."
        />
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-600">
            Sayfa {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={buildTransactionsHref({
                nextPage: Math.max(1, currentPage - 1),
              })}
              aria-disabled={currentPage <= 1}
              className={`${panelSecondaryButtonClassName} ${
                currentPage <= 1 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Önceki
            </Link>
            <Link
              href={buildTransactionsHref({
                nextPage: Math.min(totalPages, currentPage + 1),
              })}
              aria-disabled={currentPage >= totalPages}
              className={`${panelSecondaryButtonClassName} ${
                currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Sonraki
            </Link>
          </div>
        </div>
      ) : null}
    </PanelCard>
  );
}

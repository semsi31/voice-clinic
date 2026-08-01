"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, FileSearch, Search, Trash2 } from "lucide-react";
import { ActionModal } from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import { PanelLink } from "@/components/panel/panel-link";
import { PanelTableFrame } from "@/components/panel/panel-table-frame";
import {
  panelFilterFieldClassName,
  panelFilterGridClassName,
  panelFilterInputClassName,
  panelFilterLabelClassName,
  panelFilterSelectClassName,
  panelMobileCardClassName,
  panelMobileCardLabelClassName,
  panelMobileCardValueClassName,
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
  panelTableRowClassName,
} from "@/components/panel/panel-styles";
import { StatusBadge, DeviceDeliveryBadge } from "@/components/panel/status-badge";
import { deletePatientTransaction, deletePatientTransactions } from "@/app/(panel)/panel/transactions/actions";
import { runTimedMutation } from "@/lib/run-timed-mutation";
import {
  formatCurrency,
  formatDate,
  type DeviceDeliveryStatus,
  type PatientTransactionRecord,
  type PaymentStatus,
} from "@/lib/transactions";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";

/** <1280 cards · 1280–1535 compact laptop table · 1536+ wide table */
const transactionsMobileListClassName = "grid gap-3 xl:hidden";

const tableClassName =
  "w-full table-fixed border-separate border-spacing-0 text-left text-[11px] leading-snug";

const tableCellClassName =
  "overflow-hidden border-b border-slate-100 px-1.5 py-1.5 align-middle text-slate-700";

const tableHeadClassName = `${panelTableHeadClassName} whitespace-nowrap px-1.5`;

const cellActionsClassName =
  "w-[76px] min-w-[76px] overflow-visible whitespace-nowrap border-b border-slate-100 px-1 py-1.5 text-right align-middle bg-white group-odd:bg-white group-even:bg-[#E8EEF5] group-hover:bg-sky-50/80";

const headActionsClassName = `${tableHeadClassName} w-[76px] min-w-[76px] rounded-tr-[0.9rem] text-right`;

const actionButtonClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100";

const stackedPrimaryClassName =
  "block truncate whitespace-nowrap font-semibold text-slate-950";
const stackedSecondaryClassName =
  "mt-0.5 block whitespace-nowrap text-[10px] text-slate-500";
const amountLineClassName =
  "block whitespace-nowrap tabular-nums leading-snug text-slate-700";

function isLegacyTransaction(transaction: PatientTransactionRecord) {
  return transaction.source_type === "legacy_excel";
}

function deviceLabel(transaction: PatientTransactionRecord) {
  const brandModel = [transaction.brand, transaction.model]
    .filter(Boolean)
    .join(" ");
  if (brandModel) return brandModel;

  const stockLabel = transaction.stock_product_label?.trim();
  if (!stockLabel) return "-";

  // stockOptionLabel: "Ürün adı - marka model - seri - Mevcut: N"
  const productName = stockLabel.split(" - ")[0]?.trim();
  return productName || stockLabel;
}

function LegacyBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800"
      title="Eski Excel Kaydı"
    >
      Excel
    </span>
  );
}

function TransactionRowActions({
  transaction,
  onDeleted,
}: Readonly<{
  transaction: PatientTransactionRecord;
  onDeleted: (ids: string[]) => void;
}>) {
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
      <PanelLink
        href={`/panel/transactions/${transaction.id}`}
        className={actionButtonClassName}
        aria-label="Görüntüle"
        title="Görüntüle"
      >
        <Eye className="size-4" aria-hidden="true" />
      </PanelLink>
      <TransactionDeleteAction
        transaction={transaction}
        onDeleted={onDeleted}
      />
    </div>
  );
}

function TransactionDeleteAction({
  transaction,
  onDeleted,
}: Readonly<{
  transaction: PatientTransactionRecord;
  onDeleted: (ids: string[]) => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await runTimedMutation(
        { action: "deletePatientTransaction", clientRefresh: false },
        () => deletePatientTransaction(transaction.id),
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([transaction.id]);
    });
  };

  return (
    <>
      <button
        type="button"
        className={`${actionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
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

type TransactionSourceFilter = "all" | "manual" | "legacy_excel";

type TransactionListFilters = {
  search: string;
  operation: string;
  paymentStatus: "all" | PaymentStatus;
  deliveryStatus: "all" | DeviceDeliveryStatus;
  sourceType: TransactionSourceFilter;
  page: number;
};

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
  const [deliveryStatus, setDeliveryStatus] = useState(filters.deliveryStatus);
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

  const buildTransactionsHref = useCallback(({
    nextSearch,
    nextOperation,
    nextPaymentStatus,
    nextDeliveryStatus,
    nextSourceType,
    nextPage = 1,
  }: {
    nextSearch?: string;
    nextOperation?: string;
    nextPaymentStatus?: "all" | PaymentStatus;
    nextDeliveryStatus?: "all" | DeviceDeliveryStatus;
    nextSourceType?: TransactionSourceFilter;
    nextPage?: number;
  } = {}) => {
    const params = new URLSearchParams();
    const resolvedSearch = nextSearch ?? search;
    const resolvedOperation = nextOperation ?? operation;
    const resolvedPaymentStatus = nextPaymentStatus ?? paymentStatus;
    const resolvedDeliveryStatus = nextDeliveryStatus ?? deliveryStatus;
    const resolvedSourceType = nextSourceType ?? sourceType;

    const trimmedSearch = resolvedSearch.trim();
    const trimmedOperation = resolvedOperation.trim();

    if (trimmedSearch) params.set("search", trimmedSearch);
    if (trimmedOperation) params.set("operation", trimmedOperation);
    if (resolvedPaymentStatus !== "all") {
      params.set("paymentStatus", resolvedPaymentStatus);
    }
    if (resolvedDeliveryStatus !== "all") {
      params.set("deliveryStatus", resolvedDeliveryStatus);
    }
    if (resolvedSourceType !== "manual") {
      params.set("source", resolvedSourceType);
    }
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [deliveryStatus, operation, pathname, paymentStatus, search, sourceType]);

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
            <PanelLink
            href="/panel/transactions/new"
            className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          >
            Yeni İşlem
          </PanelLink>
        </div>
      }
    >
      <div className={`${panelFilterGridClassName} xl:grid-cols-3 2xl:grid-cols-6`}>
        <label className={panelFilterFieldClassName}>
          <span className={panelFilterLabelClassName}>Ara</span>
          <div className="relative min-w-0">
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
          <span className={panelFilterLabelClassName}>Teslim Durumu</span>
          <select
            className={panelFilterSelectClassName}
            value={deliveryStatus}
            onChange={(event) => {
              const value = event.target.value as "all" | DeviceDeliveryStatus;
              setDeliveryStatus(value);
              applyFilters({ nextDeliveryStatus: value });
            }}
          >
            <option value="all">Tümü</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="pending">Teslim Edilmedi</option>
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
          <PanelLink
            href="/panel/transactions"
            className={`${panelSecondaryButtonClassName} h-10 w-full px-4 py-2 sm:w-auto`}
          >
            Sıfırla
          </PanelLink>
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <>
          <div className={transactionsMobileListClassName}>
            {filteredTransactions.map((transaction) => (
              <article
                key={`mobile-${transaction.id}`}
                className={panelMobileCardClassName}
              >
                <div className="min-w-0">
                  <p className="break-words font-bold text-slate-950">
                    {transaction.patient_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(transaction.transaction_date)}
                    {transaction.transaction_no
                      ? ` · ${transaction.transaction_no}`
                      : ""}
                  </p>
                  {isLegacyTransaction(transaction) ? (
                    <div className="mt-2">
                      <LegacyBadge />
                    </div>
                  ) : null}
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
                  <div className="col-span-2 min-w-0">
                    <dt className={panelMobileCardLabelClassName}>İşlem</dt>
                    <dd className="break-words text-sm text-slate-700">
                      {transaction.operation_description}
                    </dd>
                  </div>
                  {!isLegacyTransaction(transaction) ? (
                    <>
                      <div className="col-span-2 min-w-0">
                        <dt className={panelMobileCardLabelClassName}>
                          Ödeme Durumu
                        </dt>
                        <dd className="mt-1">
                          <StatusBadge
                            status={transaction.payment_status}
                            compact
                          />
                        </dd>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <dt className={panelMobileCardLabelClassName}>
                          Teslim Durumu
                        </dt>
                        <dd className="mt-1">
                          <DeviceDeliveryBadge
                            status={
                              transaction.device_delivery_status ?? "pending"
                            }
                          />
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
                <div className="mt-3 flex gap-2">
                  <PanelLink
                    href={`/panel/transactions/${transaction.id}`}
                    className={`${panelPrimaryButtonClassName} min-h-11 flex-1`}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    Detay
                  </PanelLink>
                  <TransactionDeleteAction
                    transaction={transaction}
                    onDeleted={handleRecordsDeleted}
                  />
                </div>
              </article>
            ))}
          </div>

          {/* Laptop compact table: 1280–1535 */}
          <PanelTableFrame
            desktopOnly={false}
            className="hidden min-w-0 max-w-full overflow-hidden xl:block 2xl:hidden"
          >
            <table className={tableClassName}>
              <colgroup>
                <col className="w-[36px]" />
                <col className="w-[110px]" />
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[145px]" />
                <col className="w-[75px]" />
                <col className="w-[90px]" />
                <col className="w-[76px]" />
              </colgroup>
              <thead>
                <tr className={panelTableHeadRowClassName}>
                  <th className={tableHeadClassName}>
                    <TableSelectAllCheckbox
                      allSelected={allFilteredSelected}
                      someSelected={someFilteredSelected}
                      onToggle={toggleFilteredSelection}
                    />
                  </th>
                  <th className={tableHeadClassName}>İşlem</th>
                  <th className={tableHeadClassName}>Hasta / Telefon</th>
                  <th className={tableHeadClassName}>İşlem Türü</th>
                  <th className={tableHeadClassName}>Tutarlar</th>
                  <th className={tableHeadClassName}>Ödeme</th>
                  <th className={tableHeadClassName}>Teslim</th>
                  <th className={headActionsClassName}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={`laptop-${transaction.id}`} className={panelTableRowClassName}>
                    <td className={tableCellClassName}>
                      <TableRowCheckbox
                        checked={selectedIds.has(transaction.id)}
                        label={`${transaction.patient_name} işlemini seç`}
                        onToggle={() => toggleRecordSelection(transaction.id)}
                      />
                    </td>
                    <td className={tableCellClassName}>
                      <span
                        className={stackedPrimaryClassName}
                        title={transaction.transaction_no ?? undefined}
                      >
                        {transaction.transaction_no ?? "-"}
                      </span>
                      <span className={stackedSecondaryClassName}>
                        {formatDate(transaction.transaction_date)}
                      </span>
                    </td>
                    <td className={tableCellClassName}>
                      <span
                        className={stackedPrimaryClassName}
                        title={transaction.patient_name}
                      >
                        {transaction.patient_name}
                      </span>
                      <span
                        className={`${stackedSecondaryClassName} tabular-nums`}
                        title={transaction.patient_phone || undefined}
                      >
                        {transaction.patient_phone || "-"}
                      </span>
                    </td>
                    <td
                      className={`${tableCellClassName} truncate whitespace-nowrap`}
                      title={transaction.operation_description}
                    >
                      {transaction.operation_description}
                    </td>
                    <td className={tableCellClassName}>
                      <span
                        className={amountLineClassName}
                        title={formatCurrency(transaction.sale_amount)}
                      >
                        Satış: {formatCurrency(transaction.sale_amount)}
                      </span>
                      <span
                        className={amountLineClassName}
                        title={formatCurrency(transaction.paid_amount)}
                      >
                        Ödenen: {formatCurrency(transaction.paid_amount)}
                      </span>
                      <span
                        className={`${amountLineClassName} font-semibold text-slate-950`}
                        title={formatCurrency(transaction.remaining_debt)}
                      >
                        Kalan: {formatCurrency(transaction.remaining_debt)}
                      </span>
                    </td>
                    <td className={`${tableCellClassName} whitespace-nowrap`}>
                      {isLegacyTransaction(transaction) ? (
                        <span>-</span>
                      ) : (
                        <StatusBadge
                          status={transaction.payment_status}
                          compact
                        />
                      )}
                    </td>
                    <td className={`${tableCellClassName} whitespace-nowrap`}>
                      {isLegacyTransaction(transaction) ? (
                        <span>-</span>
                      ) : (
                        <DeviceDeliveryBadge
                          status={
                            transaction.device_delivery_status ?? "pending"
                          }
                          compact
                        />
                      )}
                    </td>
                    <td className={cellActionsClassName}>
                      <TransactionRowActions
                        transaction={transaction}
                        onDeleted={handleRecordsDeleted}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelTableFrame>

          {/* Wide desktop table: 1536+ */}
          <PanelTableFrame
            desktopOnly={false}
            className="hidden min-w-0 max-w-full overflow-hidden 2xl:block"
          >
            <table className={tableClassName}>
              <colgroup>
                <col className="w-[36px]" />
                <col className="w-[100px]" />
                <col className="w-[84px]" />
                <col className="w-[90px]" />
                <col />
                <col className="w-[72px]" />
                <col className="w-[110px]" />
                <col />
                <col className="w-[110px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[80px]" />
                <col className="w-[90px]" />
                <col className="w-[76px]" />
              </colgroup>
              <thead>
                <tr className={panelTableHeadRowClassName}>
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
                  <th className={tableHeadClassName}>Hasta</th>
                  <th className={tableHeadClassName}>Kaynak</th>
                  <th className={tableHeadClassName}>Telefon</th>
                  <th className={tableHeadClassName}>İşlem</th>
                  <th className={tableHeadClassName}>Marka / Model</th>
                  <th className={tableHeadClassName}>Satış</th>
                  <th className={tableHeadClassName}>Ödenen</th>
                  <th className={tableHeadClassName}>Kalan</th>
                  <th className={tableHeadClassName}>Ödeme</th>
                  <th className={tableHeadClassName}>Teslim</th>
                  <th className={headActionsClassName}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={`wide-${transaction.id}`} className={panelTableRowClassName}>
                    <td className={tableCellClassName}>
                      <TableRowCheckbox
                        checked={selectedIds.has(transaction.id)}
                        label={`${transaction.patient_name} işlemini seç`}
                        onToggle={() => toggleRecordSelection(transaction.id)}
                      />
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap font-semibold text-slate-950`}
                      title={transaction.transaction_no ?? undefined}
                    >
                      {transaction.transaction_no ?? "-"}
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap`}
                      title={formatDate(transaction.transaction_date)}
                    >
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td
                      className={`${tableCellClassName} truncate whitespace-nowrap`}
                      title={transaction.branch || undefined}
                    >
                      {transaction.branch || "-"}
                    </td>
                    <td
                      className={`${tableCellClassName} truncate whitespace-nowrap font-semibold text-slate-950`}
                      title={transaction.patient_name}
                    >
                      {transaction.patient_name}
                    </td>
                    <td className={`${tableCellClassName} whitespace-nowrap`}>
                      {isLegacyTransaction(transaction) ? (
                        <LegacyBadge />
                      ) : (
                        "Normal"
                      )}
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap tabular-nums`}
                      title={transaction.patient_phone || undefined}
                    >
                      {transaction.patient_phone || "-"}
                    </td>
                    <td
                      className={`${tableCellClassName} truncate whitespace-nowrap`}
                      title={transaction.operation_description}
                    >
                      {transaction.operation_description}
                    </td>
                    <td
                      className={`${tableCellClassName} truncate whitespace-nowrap`}
                      title={
                        isLegacyTransaction(transaction)
                          ? undefined
                          : deviceLabel(transaction)
                      }
                    >
                      {isLegacyTransaction(transaction)
                        ? "-"
                        : deviceLabel(transaction)}
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap font-semibold tabular-nums text-slate-950`}
                      title={formatCurrency(transaction.sale_amount)}
                    >
                      {formatCurrency(transaction.sale_amount)}
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap tabular-nums`}
                      title={formatCurrency(transaction.paid_amount)}
                    >
                      {formatCurrency(transaction.paid_amount)}
                    </td>
                    <td
                      className={`${tableCellClassName} whitespace-nowrap font-semibold tabular-nums text-slate-950`}
                      title={formatCurrency(transaction.remaining_debt)}
                    >
                      {formatCurrency(transaction.remaining_debt)}
                    </td>
                    <td className={`${tableCellClassName} whitespace-nowrap`}>
                      {isLegacyTransaction(transaction) ? (
                        <span>-</span>
                      ) : (
                        <StatusBadge
                          status={transaction.payment_status}
                          compact
                        />
                      )}
                    </td>
                    <td className={`${tableCellClassName} whitespace-nowrap`}>
                      {isLegacyTransaction(transaction) ? (
                        <span>-</span>
                      ) : (
                        <DeviceDeliveryBadge
                          status={
                            transaction.device_delivery_status ?? "pending"
                          }
                          compact
                        />
                      )}
                    </td>
                    <td className={cellActionsClassName}>
                      <TransactionRowActions
                        transaction={transaction}
                        onDeleted={handleRecordsDeleted}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelTableFrame>
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
            <PanelLink
              href={buildTransactionsHref({
                nextPage: Math.max(1, currentPage - 1),
              })}
              aria-disabled={currentPage <= 1}
              className={`${panelSecondaryButtonClassName} ${
                currentPage <= 1 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Önceki
            </PanelLink>
            <PanelLink
              href={buildTransactionsHref({
                nextPage: Math.min(totalPages, currentPage + 1),
              })}
              aria-disabled={currentPage >= totalPages}
              className={`${panelSecondaryButtonClassName} ${
                currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Sonraki
            </PanelLink>
          </div>
        </div>
      ) : null}
    </PanelCard>
  );
}

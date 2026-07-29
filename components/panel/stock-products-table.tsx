"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createStockProduct,
  deleteStockProduct,
  deleteStockProducts,
  updateStockProduct,
  type StockActionResult,
} from "@/app/(panel)/panel/stock/actions";
import {
  ActionModal,
  FormField,
  formInputClassName,
  formTextareaClassName,
} from "@/components/panel/action-modal";
import { EmptyState } from "@/components/panel/empty-state";
import { PanelCard } from "@/components/panel/panel-card";
import { PanelPendingSubmitButton } from "@/components/panel/panel-pending-submit-button";
import { PanelTableFrame } from "@/components/panel/panel-table-frame";
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
  panelTableBadgeCellClassName,
  panelTableCellClassName,
  panelTableClassName,
  panelTableRowClassName,
  panelTableActionsHeadClassName,
  panelTableHeadClassName,
  panelTableHeadRowClassName,
} from "@/components/panel/panel-styles";
import { rowActionButtonClassName } from "@/components/panel/row-actions";
import { StatusBadge } from "@/components/panel/status-badge";
import {
  stockBrandModel,
  stockProductTypeLabels,
  type StockProductRecord,
  type StockProductType,
  type StockStatus,
} from "@/lib/stock";
import { getFormRestoreKey } from "@/lib/panel-form";
import {
  BulkDeleteRecordsButton,
  TableRowCheckbox,
  TableSelectAllCheckbox,
  useTableBulkSelection,
} from "@/components/panel/table-bulk-selection";

const productTypeOptions: { value: StockProductType; label: string }[] = [
  { value: "device", label: "İşitme Cihazı" },
  { value: "battery", label: "Pil" },
  { value: "accessory", label: "Aksesuar" },
  { value: "spare_part", label: "Yedek Parça" },
  { value: "service", label: "Servis Ürünü" },
  { value: "other", label: "Diğer" },
];

type StockProductFormProps = {
  product?: StockProductRecord;
  onClose: () => void;
};

function StockProductForm({ product, onClose }: StockProductFormProps) {
  const action = product ? updateStockProduct : createStockProduct;
  const [state, formAction] = useActionState<StockActionResult | undefined, FormData>(
    action,
    undefined,
  );
  const values = state && !state.ok ? state.values : undefined;
  const formRestoreKey = getFormRestoreKey(values);

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [onClose, state]);

  return (
    <form key={formRestoreKey} action={formAction} className="grid gap-4 sm:grid-cols-2">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="sm:col-span-2">
        <FormField label="Ürün adı">
          <input
            type="text"
            name="name"
            className={formInputClassName}
            defaultValue={values?.name ?? product?.name ?? ""}
            placeholder="Örn. Oticon Real 1"
            required
          />
        </FormField>
      </div>
      <FormField label="Ürün tipi">
        <select
          name="product_type"
          className={formInputClassName}
          defaultValue={values?.product_type ?? product?.product_type ?? ""}
          required
        >
          <option value="" disabled>
            Ürün tipi seçin
          </option>
          {productTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Marka">
        <input
          type="text"
          name="brand"
          className={formInputClassName}
          defaultValue={values?.brand ?? product?.brand ?? ""}
          placeholder="Örn. Oticon"
        />
      </FormField>
      <FormField label="Model">
        <input
          type="text"
          name="model"
          className={formInputClassName}
          defaultValue={values?.model ?? product?.model ?? ""}
          placeholder="Örn. Real 1"
        />
      </FormField>
      <FormField label="Seri no">
        <input
          type="text"
          name="serial_no"
          className={formInputClassName}
          defaultValue={values?.serial_no ?? product?.serial_no ?? ""}
          placeholder="Örn. OT-2026-001"
        />
      </FormField>
      <FormField label="Şube / Birim">
        <input
          type="text"
          name="branch_unit"
          className={formInputClassName}
          defaultValue={values?.branch_unit ?? product?.branch_unit ?? ""}
          placeholder="Örn. Merkez, Klinik, Depo"
        />
      </FormField>
      {product ? (
        <FormField label="Mevcut adet">
          <input
            type="number"
            className={formInputClassName}
            value={product.quantity}
            readOnly
          />
        </FormField>
      ) : (
        <FormField label="Mevcut adet">
          <input
            type="number"
            name="quantity"
            min={0}
            className={formInputClassName}
            defaultValue={values?.quantity ?? "0"}
          />
        </FormField>
      )}
      {product ? (
        <FormField label="Adet düzeltme (opsiyonel)">
          <input
            type="number"
            name="target_quantity"
            min={0}
            className={formInputClassName}
            placeholder={`Mevcut: ${product.quantity}`}
            defaultValue={values?.target_quantity ?? ""}
          />
        </FormField>
      ) : null}
      <FormField label="Minimum stok">
        <input
          type="number"
          name="min_stock"
          min={0}
          className={formInputClassName}
          defaultValue={values?.min_stock ?? String(product?.min_stock ?? 0)}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Açıklama">
          <textarea
            name="description"
            className={formTextareaClassName}
            defaultValue={values?.description ?? product?.description ?? ""}
            placeholder="Ürün hakkında kısa not ekleyin."
          />
        </FormField>
      </div>
      {state && !state.ok ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
        >
          İptal
        </button>
        <PanelPendingSubmitButton
          className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
          idleLabel={product ? "Kaydet" : "Ürünü Kaydet"}
          pendingLabel="Kaydediliyor..."
        />
      </div>
    </form>
  );
}

function DeleteStockProductButton({
  product,
  onDeleted,
}: Readonly<{ product: StockProductRecord; onDeleted: (ids: string[]) => void }>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteStockProduct(product.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      onDeleted([product.id]);
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
          title="Ürünü Sil"
          description="Bu ürün ve ilişkili stok hareketleri silinecek."
          onClose={() => {
            if (!isPending) setIsOpen(false);
          }}
          showPrimary={false}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{product.name}</strong> kaydını silmek istediğinizden emin
              misiniz?
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

export function StockProductsTable({
  products,
}: Readonly<{
  products: StockProductRecord[];
}>) {
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState<"all" | StockProductType>(
    "all",
  );
  const [status, setStatus] = useState<"all" | StockStatus>("all");
  const [modalProduct, setModalProduct] = useState<StockProductRecord | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const {
    selectedIds,
    selectedRecords,
    visibleRecords,
    handleRecordsDeleted,
    toggleRecordSelection,
    createSelectionState,
  } = useTableBulkSelection(products);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return visibleRecords.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.brand, product.model, product.serial_no]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);
      const matchesType =
        productType === "all" || product.product_type === productType;
      const matchesStatus = status === "all" || product.status === status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [productType, search, status, visibleRecords]);

  const {
    allFilteredSelected,
    someFilteredSelected,
    toggleFilteredSelection,
  } = createSelectionState(filteredProducts);

  return (
    <>
      <PanelCard
        title="Stok Listesi"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <BulkDeleteRecordsButton
              selectedCount={selectedRecords.length}
              title="Seçili Ürünleri Sil"
              description="Bu işlem seçili stok ürünlerini kalıcı olarak silecek."
              confirmMessage={
                <p className="text-sm leading-6 text-slate-700">
                  <strong>{selectedRecords.length}</strong> ürün kaydını silmek
                  istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              }
              preview={
                <div className="max-h-48 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <ul className="space-y-1">
                    {selectedRecords.slice(0, 10).map((product) => (
                      <li key={product.id} className="truncate">
                        {product.name}
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
              errorPrefix="Ürün kayıtları silinemedi"
              successLabel="ürün kaydı silindi."
              selectedIds={selectedRecords.map((record) => record.id)}
              onDeleted={handleRecordsDeleted}
              onDelete={() =>
                deleteStockProducts(selectedRecords.map((record) => record.id))
              }
            />
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Yeni Ürün
            </button>
          </div>
        }
      >
        <div className={panelFilterGridClassName}>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ara</span>
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="size-4" aria-hidden="true" />
              </span>
              <input
                type="search"
                placeholder="Ürün adı, marka, model veya seri no"
                className={`${panelFilterInputClassName} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Ürün Tipi</span>
            <select
              className={panelFilterSelectClassName}
              value={productType}
              onChange={(event) =>
                setProductType(event.target.value as "all" | StockProductType)
              }
            >
              <option value="all">Tümü</option>
              {productTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className={panelFilterFieldClassName}>
            <span className={panelFilterLabelClassName}>Stok Durumu</span>
            <select
              className={panelFilterSelectClassName}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | StockStatus)
              }
            >
              <option value="all">Tümü</option>
              <option value="normal">Normal</option>
              <option value="low_stock">Kritik Stok</option>
              <option value="out_of_stock">Tükendi</option>
            </select>
          </label>
        </div>

        {filteredProducts.length > 0 ? (
          <>
            <div className={panelMobileCardListClassName}>
              {filteredProducts.map((product) => (
                <article
                  key={`mobile-${product.id}`}
                  className={panelMobileCardClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-slate-950">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {stockProductTypeLabels[product.product_type]}
                        {" · "}
                        {stockBrandModel(product)}
                      </p>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className={panelMobileCardLabelClassName}>
                        Mevcut Adet
                      </dt>
                      <dd className={panelMobileCardValueClassName}>
                        {product.quantity}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Min. Stok</dt>
                      <dd className={panelMobileCardValueClassName}>
                        {product.min_stock}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>Seri No</dt>
                      <dd
                        className={`${panelMobileCardValueClassName} break-all font-mono text-xs`}
                      >
                        {product.serial_no || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className={panelMobileCardLabelClassName}>
                        Şube / Birim
                      </dt>
                      <dd
                        className={`${panelMobileCardValueClassName} break-words`}
                      >
                        {product.branch_unit || "-"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`${panelSecondaryButtonClassName} min-h-11 flex-1`}
                      onClick={() => setModalProduct(product)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Düzenle
                    </button>
                    <DeleteStockProductButton
                      product={product}
                      onDeleted={handleRecordsDeleted}
                    />
                  </div>
                </article>
              ))}
            </div>

            <PanelTableFrame>
              <table className={panelTableClassName}>
                <colgroup>
                  <col className="w-9" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[7.25rem]" />
                  <col className="w-[5.75rem]" />
                </colgroup>
                <thead>
                  <tr className={panelTableHeadRowClassName}>
                    <th className={panelTableHeadClassName}>
                      <TableSelectAllCheckbox
                        allSelected={allFilteredSelected}
                        someSelected={someFilteredSelected}
                        onToggle={toggleFilteredSelection}
                      />
                    </th>
                    <th className={panelTableHeadClassName}>Ürün Adı</th>
                    <th className={panelTableHeadClassName}>Ürün Tipi</th>
                    <th className={panelTableHeadClassName}>Marka / Model</th>
                    <th className={panelTableHeadClassName}>Seri No</th>
                    <th className={panelTableHeadClassName}>Şube / Birim</th>
                    <th className={`${panelTableHeadClassName} text-right`}>Adet</th>
                    <th className={`${panelTableHeadClassName} text-right`}>Min.</th>
                    <th className={panelTableHeadClassName}>Durum</th>
                    <th className={panelTableActionsHeadClassName}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={panelTableRowClassName}>
                      <td className={panelTableCellClassName}>
                        <TableRowCheckbox
                          checked={selectedIds.has(product.id)}
                          label={`${product.name} kaydını seç`}
                          onToggle={() => toggleRecordSelection(product.id)}
                        />
                      </td>
                      <td
                        className={`${panelTableCellClassName} font-semibold text-slate-950`}
                        title={product.name}
                      >
                        {product.name}
                      </td>
                      <td
                        className={panelTableCellClassName}
                        title={stockProductTypeLabels[product.product_type]}
                      >
                        {stockProductTypeLabels[product.product_type]}
                      </td>
                      <td
                        className={panelTableCellClassName}
                        title={stockBrandModel(product)}
                      >
                        {stockBrandModel(product)}
                      </td>
                      <td
                        className={`${panelTableCellClassName} font-mono text-xs`}
                        title={product.serial_no || undefined}
                      >
                        {product.serial_no || "-"}
                      </td>
                      <td
                        className={panelTableCellClassName}
                        title={product.branch_unit || undefined}
                      >
                        {product.branch_unit || "-"}
                      </td>
                      <td
                        className={`${panelTableCellClassName} text-right font-semibold text-slate-950`}
                      >
                        {product.quantity}
                      </td>
                      <td className={`${panelTableCellClassName} text-right`}>
                        {product.min_stock}
                      </td>
                      <td className={panelTableBadgeCellClassName}>
                        <StatusBadge status={product.status} />
                      </td>
                      <td className={panelTableActionsCellClassName}>
                        <div className="flex shrink-0 items-center justify-end gap-1">
                          <button
                            type="button"
                            className={rowActionButtonClassName}
                            aria-label="Düzenle"
                            title="Düzenle"
                            onClick={() => setModalProduct(product)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                          <DeleteStockProductButton
                            product={product}
                            onDeleted={handleRecordsDeleted}
                          />
                        </div>
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
            title="Stok kaydı bulunamadı"
            description="Seçili filtrelerle eşleşen ürün kaydı yok."
          />
        )}
      </PanelCard>

      {isCreateOpen ? (
        <ActionModal
          title="Yeni Ürün Ekle"
          description="Stok listesine yeni ürün kaydı oluşturun."
          onClose={() => setIsCreateOpen(false)}
          showPrimary={false}
          showFooter={false}
        >
          <StockProductForm onClose={() => setIsCreateOpen(false)} />
        </ActionModal>
      ) : null}

      {modalProduct ? (
        <ActionModal
          title="Ürünü Düzenle"
          description="Ürün bilgilerini güncelleyin veya opsiyonel adet düzeltmesi girin."
          onClose={() => setModalProduct(null)}
          showPrimary={false}
          showFooter={false}
        >
          <StockProductForm
            product={modalProduct}
            onClose={() => setModalProduct(null)}
          />
        </ActionModal>
      ) : null}
    </>
  );
}

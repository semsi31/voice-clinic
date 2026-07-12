"use client";

import { useState } from "react";
import type { NewTransactionFormValues } from "@/app/(panel)/panel/transactions/actions";
import { stockOptionLabel, type StockProductRecord } from "@/lib/stock";

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function TransactionDeviceFields({
  stockProducts,
  values,
}: Readonly<{
  stockProducts: StockProductRecord[];
  values?: NewTransactionFormValues;
}>) {
  const [deductStock, setDeductStock] = useState(
    values?.stock_deduct_enabled ?? false,
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-slate-50">
          <input
            type="checkbox"
            name="stock_deduct_enabled"
            value="true"
            checked={deductStock}
            onChange={(event) => setDeductStock(event.target.checked)}
            className="mt-0.5 size-5 min-h-5 min-w-5 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-sky-200"
          />
          <span className="text-sm font-semibold text-slate-800">
            Bu işlemde stoktan ürün düş
          </span>
        </label>
      </div>

      {deductStock ? (
        <>
          <div className="lg:col-span-2 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
            <p className="text-sm leading-6 text-amber-900">
              İşlem kaydedildiğinde seçilen ürün için stok hareketi oluşturulur
              ve adet stoktan düşülür.
            </p>
          </div>

          <Field label="Stok ürünü seç">
            <select
              name="stock_product_id"
              className={inputClassName}
              defaultValue={values?.stock_product_id ?? ""}
              required={deductStock}
            >
              <option value="" disabled>
                {stockProducts.length > 0
                  ? "Stok ürünü seçin"
                  : "Stokta mevcut ürün yok"}
              </option>
              {stockProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {stockOptionLabel(product)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Adet">
            <input
              type="number"
              name="stock_quantity"
              min={1}
              defaultValue={values?.stock_quantity || "1"}
              className={inputClassName}
            />
          </Field>
        </>
      ) : null}

      <Field label="Marka">
        <input
          type="text"
          name="brand"
          className={inputClassName}
          placeholder="Örn. Oticon"
          defaultValue={values?.brand ?? ""}
        />
      </Field>
      <Field label="Model">
        <input
          type="text"
          name="model"
          className={inputClassName}
          placeholder="Örn. Real 1"
          defaultValue={values?.model ?? ""}
        />
      </Field>
      <Field label="Seri no">
        <input
          type="text"
          name="serial_no"
          className={inputClassName}
          placeholder="Örn. VK-2026-0001"
          defaultValue={values?.serial_no ?? ""}
        />
      </Field>
      <Field label="Kulak">
        <select
          name="ear_side"
          className={inputClassName}
          defaultValue={values?.ear_side ?? ""}
        >
          <option value="" disabled>
            Kulak seçin
          </option>
          <option value="right">Sağ</option>
          <option value="left">Sol</option>
          <option value="both">Çift</option>
        </select>
      </Field>
    </div>
  );
}

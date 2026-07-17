"use server";

import { revalidatePath } from "next/cache";
import { extractFormValues } from "@/lib/panel-form";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { deleteRecordsInChunks } from "@/lib/supabase-bulk-delete";
import { optionalText, readText } from "@/lib/transactions";
import type { StockProductType } from "@/lib/stock";

const allowedProductTypes = new Set([
  "device",
  "battery",
  "accessory",
  "spare_part",
  "service",
  "other",
]);

export type StockFormValues = {
  name: string;
  product_type: string;
  brand: string;
  model: string;
  serial_no: string;
  branch_unit: string;
  quantity: string;
  min_stock: string;
  target_quantity: string;
  description: string;
};

const stockFormFields = [
  "name",
  "product_type",
  "brand",
  "model",
  "serial_no",
  "branch_unit",
  "quantity",
  "min_stock",
  "target_quantity",
  "description",
] as const;

export type StockActionResult =
  | { ok: true }
  | { ok: false; error: string; values?: StockFormValues };

function stockFormError(
  formData: FormData,
  error: string,
): { ok: false; error: string; values: StockFormValues } {
  return {
    ok: false,
    error,
    values: extractFormValues(formData, [...stockFormFields]) as StockFormValues,
  };
}

function readInteger(value: FormDataEntryValue | null): number {
  const text = readText(value);
  const parsed = Number.parseInt(text || "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProductType(value: FormDataEntryValue | null) {
  const type = readText(value);
  return allowedProductTypes.has(type) ? (type as StockProductType) : null;
}

export async function createStockProduct(
  _prevState: StockActionResult | undefined,
  formData: FormData,
): Promise<StockActionResult | undefined> {
  const name = readText(formData.get("name"));
  const productType = normalizeProductType(formData.get("product_type"));
  const initialQuantity = readInteger(formData.get("quantity"));
  const minStock = readInteger(formData.get("min_stock"));

  if (!name) {
    return stockFormError(formData, "Ürün adı zorunludur.");
  }

  if (!productType) {
    return stockFormError(formData, "Geçerli bir ürün tipi seçilmelidir.");
  }

  if (initialQuantity < 0 || minStock < 0) {
    return stockFormError(formData, "Adet ve minimum stok negatif olamaz.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return stockFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, email } = auth;
  const { data: product, error: productError } = await supabase
    .from("stock_products")
    .insert({
      name,
      product_type: productType,
      brand: optionalText(formData.get("brand")),
      model: optionalText(formData.get("model")),
      serial_no: optionalText(formData.get("serial_no")),
      branch_unit: optionalText(formData.get("branch_unit")),
      quantity: 0,
      min_stock: minStock,
      description: optionalText(formData.get("description")),
    })
    .select("id")
    .single();

  if (productError || !product) {
    return stockFormError(formData, "Ürün kaydı oluşturulamadı.");
  }

  if (initialQuantity > 0) {
    const { error: movementError } = await supabase.from("stock_movements").insert({
      stock_product_id: product.id,
      movement_type: "in",
      quantity_change: initialQuantity,
      movement_date: new Date().toISOString().slice(0, 10),
      staff_name: email,
      note: "Yeni ürün başlangıç stoğu",
    });

    if (movementError) {
      await supabase.from("stock_products").delete().eq("id", product.id);
      return stockFormError(formData, "Başlangıç stok hareketi oluşturulamadı.");
    }
  }

  revalidatePath("/panel/stock");
  return { ok: true };
}

export async function updateStockProduct(
  _prevState: StockActionResult | undefined,
  formData: FormData,
): Promise<StockActionResult | undefined> {
  const id = readText(formData.get("id"));
  const name = readText(formData.get("name"));
  const productType = normalizeProductType(formData.get("product_type"));
  const minStock = readInteger(formData.get("min_stock"));
  const targetQuantityText = readText(formData.get("target_quantity"));

  if (!id) {
    return stockFormError(formData, "Ürün kaydı bulunamadı.");
  }

  if (!name) {
    return stockFormError(formData, "Ürün adı zorunludur.");
  }

  if (!productType) {
    return stockFormError(formData, "Geçerli bir ürün tipi seçilmelidir.");
  }

  if (minStock < 0) {
    return stockFormError(formData, "Minimum stok negatif olamaz.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return stockFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, email } = auth;
  const { data: currentProduct, error: currentError } = await supabase
    .from("stock_products")
    .select("quantity")
    .eq("id", id)
    .single();

  if (currentError || !currentProduct) {
    return stockFormError(formData, "Ürün kaydı bulunamadı.");
  }

  const targetQuantity =
    targetQuantityText.length > 0
      ? Number.parseInt(targetQuantityText, 10)
      : null;

  if (targetQuantity !== null && (!Number.isFinite(targetQuantity) || targetQuantity < 0)) {
    return stockFormError(formData, "Adet düzeltme değeri negatif olamaz.");
  }

  const { error: updateError } = await supabase
    .from("stock_products")
    .update({
      name,
      product_type: productType,
      brand: optionalText(formData.get("brand")),
      model: optionalText(formData.get("model")),
      serial_no: optionalText(formData.get("serial_no")),
      branch_unit: optionalText(formData.get("branch_unit")),
      min_stock: minStock,
      description: optionalText(formData.get("description")),
    })
    .eq("id", id);

  if (updateError) {
    return stockFormError(formData, "Ürün kaydı güncellenemedi.");
  }

  if (targetQuantity !== null) {
    const quantityChange = targetQuantity - Number(currentProduct.quantity);

    if (quantityChange !== 0) {
      const { error: movementError } = await supabase.from("stock_movements").insert({
        stock_product_id: id,
        movement_type: "adjustment",
        quantity_change: quantityChange,
        movement_date: new Date().toISOString().slice(0, 10),
        staff_name: email,
        note: "Ürün düzenleme modalından adet düzeltmesi",
      });

      if (movementError) {
        return stockFormError(formData, "Adet düzeltme hareketi oluşturulamadı.");
      }
    }
  }

  revalidatePath("/panel/stock");
  return { ok: true };
}

export async function deleteStockProduct(id: string): Promise<StockActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await supabase.from("stock_products").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Ürün kaydı silinemedi." };
  }

  revalidatePath("/panel/stock");
  return { ok: true };
}

export async function deleteStockProducts(
  ids: string[],
): Promise<StockActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  return deleteRecordsInChunks(
    supabase,
    "stock_products",
    ids,
    ["/panel/stock"],
    "ürün kayıtları silinemedi",
  );
}

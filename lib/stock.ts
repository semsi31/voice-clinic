export type StockProductType =
  | "device"
  | "battery"
  | "accessory"
  | "spare_part"
  | "service"
  | "other";

export type StockStatus = "normal" | "low_stock" | "out_of_stock";

export type StockMovementType =
  | "in"
  | "out"
  | "sale"
  | "return"
  | "adjustment";

export type StockProductRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  product_type: StockProductType;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  branch_unit: string | null;
  quantity: number;
  min_stock: number;
  description: string | null;
  status: StockStatus;
};

export type StockMovementRecord = {
  id: string;
  created_at: string;
  stock_product_id: string;
  movement_type: StockMovementType;
  quantity_change: number;
  movement_date: string;
  staff_name: string | null;
  transaction_id: string | null;
  note: string | null;
};

export const stockProductTypeLabels: Record<StockProductType, string> = {
  device: "İşitme Cihazı",
  battery: "Pil",
  accessory: "Aksesuar",
  spare_part: "Yedek Parça",
  service: "Servis Ürünü",
  other: "Diğer",
};

export function stockBrandModel(product: Pick<StockProductRecord, "brand" | "model">) {
  return [product.brand, product.model].filter(Boolean).join(" ") || "-";
}

export function stockOptionLabel(
  product: Pick<
    StockProductRecord,
    "name" | "brand" | "model" | "serial_no" | "quantity"
  >,
) {
  const brandModel = [product.brand, product.model].filter(Boolean).join(" ");
  const serialNo = product.serial_no || "-";

  return `${product.name} - ${brandModel || "-"} - ${serialNo} - Mevcut: ${product.quantity}`;
}

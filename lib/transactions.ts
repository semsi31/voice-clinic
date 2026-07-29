export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "cash" | "credit_card" | "bank_transfer";
export type PatientTransactionSourceType = "manual" | "legacy_excel";
export type DeviceDeliveryStatus = "pending" | "delivered";

export type PatientTransactionRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  transaction_no: string | null;
  patient_name: string;
  patient_phone: string | null;
  description: string | null;
  branch: string | null;
  transaction_date: string;
  hospital: string | null;
  doctor_name: string | null;
  reference_source: string | null;
  operation_description: string;
  staff_name: string | null;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  ear_side: string | null;
  sale_amount: number;
  paid_amount: number;
  remaining_debt: number;
  payment_status: PaymentStatus;
  stock_deduct_enabled: boolean;
  stock_product_id: string | null;
  stock_product_label: string | null;
  stock_quantity: number | null;
  notes: string | null;
  source_type: PatientTransactionSourceType;
  legacy_sheet_name: string | null;
  legacy_row_number: number | null;
  device_delivery_status: DeviceDeliveryStatus;
  device_delivered_at: string | null;
};

export const deviceDeliveryStatusLabels: Record<DeviceDeliveryStatus, string> = {
  pending: "Teslim Edilmedi",
  delivered: "Teslim Edildi",
};

export const deviceDeliveryStatusOptions: {
  value: DeviceDeliveryStatus;
  label: string;
}[] = [
  { value: "pending", label: "Teslim Edilmedi" },
  { value: "delivered", label: "Teslim Edildi" },
];

export type TransactionPaymentRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  transaction_id: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number;
  description: string | null;
  received_by: string | null;
  receipt_document_id: string | null;
  receipt_generated_at: string | null;
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  bank_transfer: "Havale",
};

export const earSideLabels: Record<string, string> = {
  right: "Sağ",
  left: "Sol",
  both: "Çift",
};

export function formatCurrency(value: number | string | null | undefined) {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function parseMoneyInput(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;

  const normalized = value
    .replace(/[₺\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(value: FormDataEntryValue | null): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

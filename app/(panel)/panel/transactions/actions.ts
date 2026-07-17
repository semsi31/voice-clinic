"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cleanupPaymentReceipt,
  cleanupTransactionPaymentReceipts,
  createPaymentReceiptDocument,
  PAYMENT_RECEIPT_DELETE_ERROR,
  recreatePaymentReceiptDocument,
  TRANSACTION_RECEIPT_DELETE_ERROR,
} from "@/lib/payment-receipts";
import type { ReminderStatus } from "@/lib/reminders";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { createR2SignedDownloadUrl } from "@/lib/r2-storage";
import { deleteRecordsSequentially } from "@/lib/supabase-bulk-delete";
import type { BulkDeleteActionResult } from "@/lib/panel-bulk-delete";
import type { createClient } from "@/lib/supabase/server";
import {
  optionalText,
  parseMoneyInput,
  readText,
  type PaymentMethod,
} from "@/lib/transactions";
import { extractFormValues } from "@/lib/panel-form";
import { stockOptionLabel, type StockProductRecord } from "@/lib/stock";

const allowedPaymentMethods = new Set(["cash", "credit_card", "bank_transfer"]);
const PAYMENT_EXCEEDS_SALE_ERROR = "Ödeme toplamı satış tutarını aşamaz.";

function sumPaymentAmounts(
  payments: Array<{ amount: number | string | null }>,
): number {
  return payments.reduce((total, payment) => {
    const parsed = Number(payment.amount ?? 0);
    return total + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

async function getTransactionSaleAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactionId: string,
): Promise<{ saleAmount: number; isLegacyExcelRecord: boolean } | null> {
  const { data, error } = await supabase
    .from("patient_transactions")
    .select("sale_amount, source_type")
    .eq("id", transactionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    saleAmount: Number(data.sale_amount ?? 0),
    isLegacyExcelRecord: data.source_type === "legacy_excel",
  };
}

async function getPaymentsTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactionId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("transaction_payments")
    .select("amount")
    .eq("transaction_id", transactionId);

  if (error) {
    return null;
  }

  return sumPaymentAmounts(data ?? []);
}

export type NewTransactionFormValues = {
  patient_name: string;
  patient_phone: string;
  description: string;
  reminder_date: string;
  reminder_description: string;
  branch: string;
  transaction_date: string;
  hospital: string;
  doctor_name: string;
  reference_source: string;
  operation_description: string;
  staff_name: string;
  brand: string;
  model: string;
  serial_no: string;
  ear_side: string;
  sale_amount: string;
  stock_deduct_enabled: boolean;
  stock_product_id: string;
  stock_quantity: string;
  first_payment_date: string;
  first_payment_method: string;
  first_payment_amount: string;
  first_payment_description: string;
};

export type PaymentFormValues = {
  payment_date: string;
  payment_method: string;
  amount: string;
  description: string;
  received_by: string;
};

const paymentFormFields = [
  "payment_date",
  "payment_method",
  "amount",
  "description",
  "received_by",
] as const;

type FormActionState<TValues> =
  | {
      error?: string;
      warning?: string;
      success?: boolean;
      values?: TValues;
    }
  | undefined;

export type NewTransactionActionState = FormActionState<NewTransactionFormValues>;

export type TransactionActionState = FormActionState<PaymentFormValues>;

export type PaymentActionResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string; values?: PaymentFormValues };

export type PaymentReceiptUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type ReminderActionResult =
  | { ok: true }
  | { ok: false; error: string };

const allowedReminderStatuses = new Set<ReminderStatus>([
  "pending",
  "completed",
  "delayed",
  "cancelled",
]);

function readDate(value: FormDataEntryValue | null): string {
  const text = readText(value);
  return text || new Date().toISOString().slice(0, 10);
}

function readRawFormValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function readOptionalReminderDate(
  value: FormDataEntryValue | null,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value !== null && typeof value !== "string") {
    return { ok: false, error: "Geçersiz hatırlatma tarihi." };
  }

  const reminderDateRaw = String(value ?? "").trim();
  const reminderDate = reminderDateRaw.length > 0 ? reminderDateRaw : null;

  if (reminderDate && !isValidIsoDate(reminderDate)) {
    return { ok: false, error: "Geçersiz hatırlatma tarihi." };
  }

  return { ok: true, value: reminderDate };
}

function extractNewTransactionFormValues(
  formData: FormData,
): NewTransactionFormValues {
  return {
    patient_name: readText(formData.get("patient_name")),
    patient_phone: readText(formData.get("patient_phone")),
    description: readRawFormValue(formData.get("description")),
    reminder_date: readText(formData.get("reminder_date")),
    reminder_description: readRawFormValue(formData.get("reminder_description")),
    branch: readText(formData.get("branch")),
    transaction_date: readText(formData.get("transaction_date")),
    hospital: readText(formData.get("hospital")),
    doctor_name: readText(formData.get("doctor_name")),
    reference_source: readText(formData.get("reference_source")),
    operation_description: readText(formData.get("operation_description")),
    staff_name: readText(formData.get("staff_name")),
    brand: readText(formData.get("brand")),
    model: readText(formData.get("model")),
    serial_no: readText(formData.get("serial_no")),
    ear_side: readText(formData.get("ear_side")),
    sale_amount: readRawFormValue(formData.get("sale_amount")),
    stock_deduct_enabled: formData.get("stock_deduct_enabled") === "true",
    stock_product_id: readText(formData.get("stock_product_id")),
    stock_quantity: readText(formData.get("stock_quantity")),
    first_payment_date: readText(formData.get("first_payment_date")),
    first_payment_method: readText(formData.get("first_payment_method")),
    first_payment_amount: readRawFormValue(formData.get("first_payment_amount")),
    first_payment_description: readText(formData.get("first_payment_description")),
  };
}

function extractPaymentFormValues(formData: FormData): PaymentFormValues {
  return extractFormValues(formData, [...paymentFormFields]) as PaymentFormValues;
}

function paymentFormError(
  formData: FormData,
  error: string,
): TransactionActionState {
  return { error, values: extractPaymentFormValues(formData) };
}

function newTransactionFormError(
  formData: FormData,
  error: string,
): NewTransactionActionState {
  return { error, values: extractNewTransactionFormValues(formData) };
}

function resolveReminderDescription(reminderDescription: string | null): string {
  return reminderDescription ?? "İşlem kaydı üzerinden oluşturuldu.";
}

function normalizeReminderStatus(
  value: FormDataEntryValue | null,
): ReminderStatus | null {
  const status = readText(value);
  return allowedReminderStatuses.has(status as ReminderStatus)
    ? (status as ReminderStatus)
    : null;
}

function readRequiredReminderDate(
  value: FormDataEntryValue | null,
): { ok: true; value: string } | { ok: false; error: string } {
  const result = readOptionalReminderDate(value);

  if (!result.ok) {
    return result;
  }

  if (!result.value) {
    return { ok: false, error: "Hatırlatma tarihi zorunludur." };
  }

  return { ok: true, value: result.value };
}

function getTransactionRelatedRecord(transaction: {
  id: string;
  transaction_no: string | null;
}): string {
  return transaction.transaction_no ?? transaction.id;
}

function getTransactionReminderLookupValues(transaction: {
  id: string;
  transaction_no: string | null;
}): string[] {
  return transaction.transaction_no
    ? [transaction.id, transaction.transaction_no]
    : [transaction.id];
}

function revalidateTransactionReminderPaths(transactionId: string) {
  revalidatePath(`/panel/transactions/${transactionId}`);
  revalidatePath("/panel/transactions");
  revalidatePath("/panel/reminders");
  revalidatePath("/panel/dashboard");
}

function revalidatePaymentReceiptPaths(transactionId: string) {
  revalidatePath("/panel/documents");
  revalidatePath("/panel/transactions");
  revalidatePath(`/panel/transactions/${transactionId}`);
  revalidatePath("/panel/dashboard");
  revalidatePath("/panel/reports");
  revalidatePath("/panel/income-expense");
}

function normalizePaymentMethod(value: FormDataEntryValue | null) {
  const method = readText(value);
  return allowedPaymentMethods.has(method) ? (method as PaymentMethod) : null;
}

export async function createPatientTransaction(
  _prevState: NewTransactionActionState,
  formData: FormData,
): Promise<NewTransactionActionState> {
  const patientName = readText(formData.get("patient_name"));
  const operationDescription = readText(formData.get("operation_description"));
  const saleAmount = parseMoneyInput(formData.get("sale_amount"));

  if (!patientName) {
    return newTransactionFormError(formData, "Hasta adı soyadı zorunludur.");
  }

  if (!operationDescription) {
    return newTransactionFormError(formData, "Yapılan işlem alanı zorunludur.");
  }

  if (saleAmount < 0) {
    return newTransactionFormError(formData, "Satış tutarı negatif olamaz.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return newTransactionFormError(
      formData,
      getPanelAuthErrorMessage(error),
    );
  }

  const { supabase, userId, email } = auth;
  const firstPaymentAmount = parseMoneyInput(formData.get("first_payment_amount"));
  const firstPaymentMethod = normalizePaymentMethod(
    formData.get("first_payment_method"),
  );

  if (firstPaymentAmount > 0 && !firstPaymentMethod) {
    return newTransactionFormError(
      formData,
      "İlk ödeme tutarı girildiyse ödeme yöntemi seçilmelidir.",
    );
  }

  if (firstPaymentAmount > saleAmount) {
    return newTransactionFormError(formData, PAYMENT_EXCEEDS_SALE_ERROR);
  }

  const reminderDateResult = readOptionalReminderDate(formData.get("reminder_date"));

  if (!reminderDateResult.ok) {
    return newTransactionFormError(formData, reminderDateResult.error);
  }

  const reminderDate = reminderDateResult.value;
  const reminderDescription = optionalText(formData.get("reminder_description"));
  const transactionDescription = optionalText(formData.get("description"));
  const staffName = optionalText(formData.get("staff_name"));

  const stockDeductEnabled = formData.get("stock_deduct_enabled") === "true";
  const stockProductId = stockDeductEnabled
    ? readText(formData.get("stock_product_id"))
    : "";
  const stockQuantityText = readText(formData.get("stock_quantity"));
  const stockQuantity = stockDeductEnabled
    ? Number.parseInt(stockQuantityText || "1", 10)
    : null;

  if (stockDeductEnabled && !stockProductId) {
    return newTransactionFormError(
      formData,
      "Stoktan ürün düşmek için ürün seçilmelidir.",
    );
  }

  if (
    stockDeductEnabled &&
    (!Number.isFinite(stockQuantity) || (stockQuantity ?? 0) <= 0)
  ) {
    return newTransactionFormError(
      formData,
      "Stok düşme adedi sıfırdan büyük olmalıdır.",
    );
  }

  let stockProduct: StockProductRecord | null = null;

  if (stockDeductEnabled) {
    const { data, error } = await supabase
      .from("stock_products")
      .select("*")
      .eq("id", stockProductId)
      .single();

    if (error || !data) {
      return newTransactionFormError(formData, "Seçilen stok ürünü bulunamadı.");
    }

    stockProduct = data as StockProductRecord;

    if (stockProduct.quantity < (stockQuantity ?? 0)) {
      return newTransactionFormError(
        formData,
        `Yetersiz stok. Mevcut adet: ${stockProduct.quantity}.`,
      );
    }
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .insert({
      patient_name: patientName,
      patient_phone: optionalText(formData.get("patient_phone")),
      description: transactionDescription,
      branch: optionalText(formData.get("branch")),
      transaction_date: readDate(formData.get("transaction_date")),
      hospital: optionalText(formData.get("hospital")),
      doctor_name: optionalText(formData.get("doctor_name")),
      reference_source: optionalText(formData.get("reference_source")),
      operation_description: operationDescription,
      staff_name: staffName,
      brand: optionalText(formData.get("brand")),
      model: optionalText(formData.get("model")),
      serial_no: optionalText(formData.get("serial_no")),
      ear_side: optionalText(formData.get("ear_side")),
      sale_amount: saleAmount,
      stock_deduct_enabled: stockDeductEnabled,
      stock_product_id: stockDeductEnabled ? stockProductId : null,
      stock_product_label: stockDeductEnabled
        ? stockProduct
          ? stockOptionLabel(stockProduct)
          : null
        : null,
      stock_quantity:
        stockDeductEnabled && Number.isFinite(stockQuantity)
          ? stockQuantity
          : null,
      notes: optionalText(formData.get("notes")),
    })
    .select("id, transaction_no")
    .single();

  if (transactionError || !transaction) {
    return newTransactionFormError(formData, "İşlem kaydı oluşturulamadı.");
  }

  if (firstPaymentAmount > 0) {
    const { data: firstPayment, error: paymentError } = await supabase
      .from("transaction_payments")
      .insert({
        transaction_id: transaction.id,
        payment_date: readDate(formData.get("first_payment_date")),
        payment_method: firstPaymentMethod,
        amount: firstPaymentAmount,
        description: optionalText(formData.get("first_payment_description")) ?? "İlk ödeme",
        received_by: staffName,
      })
      .select("id")
      .single();

    if (paymentError || !firstPayment) {
      await supabase.from("patient_transactions").delete().eq("id", transaction.id);
      return newTransactionFormError(
        formData,
        "İlk ödeme kaydedilemediği için işlem oluşturulmadı.",
      );
    }

    const receiptResult = await createPaymentReceiptDocument({
      supabase,
      transactionId: transaction.id,
      paymentId: firstPayment.id,
      fallbackReceivedBy: email,
      createdByUserId: userId,
    });

    if (!receiptResult.ok) {
      console.error(receiptResult.error, {
        transactionId: transaction.id,
        paymentId: firstPayment.id,
      });
    }
  }

  if (stockDeductEnabled && stockProduct && stockQuantity) {
    const { error: stockMovementError } = await supabase
      .from("stock_movements")
      .insert({
        stock_product_id: stockProduct.id,
        movement_type: "sale",
        quantity_change: -stockQuantity,
        transaction_id: transaction.id,
        staff_name: staffName ?? email,
        note: "Hasta işlem kaydı üzerinden stok düşüldü",
      });

    if (stockMovementError) {
      await supabase.from("patient_transactions").delete().eq("id", transaction.id);
      return newTransactionFormError(
        formData,
        "Stok hareketi oluşturulamadığı için işlem kaydı geri alındı. Stok adedini kontrol edin.",
      );
    }
  }

  let reminderCreated = false;

  if (reminderDate) {
    const { error: reminderError } = await supabase.from("reminders").insert({
      reminder_date: reminderDate,
      reminder_time: null,
      title: "Hasta işlem hatırlatması",
      patient_name: patientName,
      related_record: transaction.transaction_no ?? transaction.id,
      responsible_person: staffName,
      status: "pending",
      description: resolveReminderDescription(reminderDescription),
    });

    if (reminderError) {
      revalidatePath("/panel/transactions");
      revalidatePath("/panel/stock");
      revalidatePath("/panel/dashboard");
      revalidatePath("/panel/reports");
      return newTransactionFormError(
        formData,
        "İşlem oluşturuldu ancak hatırlatıcı oluşturulamadı.",
      );
    }

    reminderCreated = true;
  }

  revalidatePath("/panel/transactions");
  revalidatePath("/panel/documents");
  revalidatePath("/panel/stock");
  revalidatePath("/panel/dashboard");
  revalidatePath("/panel/reports");
  revalidatePath("/panel/income-expense");

  if (reminderCreated) {
    revalidatePath("/panel/reminders");
  }

  redirect(`/panel/transactions/${transaction.id}`);
}

export async function addTransactionPayment(
  _prevState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const transactionId = readText(formData.get("transaction_id"));
  const amount = parseMoneyInput(formData.get("amount"));
  const paymentMethod = normalizePaymentMethod(formData.get("payment_method"));

  if (!transactionId) {
    return paymentFormError(formData, "İşlem kaydı bulunamadı.");
  }

  if (!paymentMethod) {
    return paymentFormError(formData, "Ödeme yöntemi seçilmelidir.");
  }

  if (amount <= 0) {
    return paymentFormError(formData, "Ödeme tutarı sıfırdan büyük olmalıdır.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return paymentFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, userId, email } = auth;
  const transactionPaymentContext = await getTransactionSaleAmount(
    supabase,
    transactionId,
  );

  if (transactionPaymentContext === null) {
    return paymentFormError(formData, "İşlem kaydı bulunamadı.");
  }

  if (transactionPaymentContext.isLegacyExcelRecord) {
    return paymentFormError(
      formData,
      "Eski Excel kayıtlarına ödeme eklenemez.",
    );
  }

  const paymentsTotal = await getPaymentsTotal(supabase, transactionId);

  if (paymentsTotal === null) {
    return paymentFormError(formData, "Ödeme kayıtları okunamadı.");
  }

  if (paymentsTotal + amount > transactionPaymentContext.saleAmount) {
    return paymentFormError(formData, PAYMENT_EXCEEDS_SALE_ERROR);
  }

  const { data: payment, error } = await supabase
    .from("transaction_payments")
    .insert({
      transaction_id: transactionId,
      payment_date: readDate(formData.get("payment_date")),
      payment_method: paymentMethod,
      amount,
      description: optionalText(formData.get("description")),
      received_by: optionalText(formData.get("received_by")),
    })
    .select("id")
    .single();

  if (error || !payment) {
    return paymentFormError(formData, "Ödeme kaydı eklenemedi.");
  }

  const receiptResult = await createPaymentReceiptDocument({
    supabase,
    transactionId,
    paymentId: payment.id,
    fallbackReceivedBy: email,
    createdByUserId: userId,
  });

  if (!receiptResult.ok) {
    console.error(receiptResult.error, {
      transactionId,
      paymentId: payment.id,
    });
  }

  revalidatePaymentReceiptPaths(transactionId);

  if (!receiptResult.ok) {
    return {
      success: true,
      warning: "Tahsilat makbuzu oluşturulamadı.",
    };
  }

  return { success: true };
}

function paymentActionError(
  formData: FormData,
  error: string,
): PaymentActionResult {
  return { ok: false, error, values: extractPaymentFormValues(formData) };
}

export async function updateTransactionPaymentAction(
  paymentId: string,
  formData: FormData,
): Promise<PaymentActionResult> {
  if (!paymentId) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  const amount = parseMoneyInput(formData.get("amount"));
  const paymentMethod = normalizePaymentMethod(formData.get("payment_method"));
  const paymentDate = readDate(formData.get("payment_date"));

  if (!paymentMethod) {
    return paymentActionError(formData, "Geçerli bir ödeme yöntemi seçilmelidir.");
  }

  if (amount <= 0) {
    return paymentActionError(formData, "Ödeme tutarı sıfırdan büyük olmalıdır.");
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return paymentActionError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, userId, email } = auth;
  const { data: payment, error: fetchError } = await supabase
    .from("transaction_payments")
    .select("transaction_id, amount, receipt_document_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !payment) {
    return paymentActionError(formData, "Ödeme kaydı bulunamadı.");
  }

  const transactionPaymentContext = await getTransactionSaleAmount(
    supabase,
    payment.transaction_id,
  );

  if (transactionPaymentContext === null) {
    return paymentActionError(formData, "İşlem kaydı bulunamadı.");
  }

  if (transactionPaymentContext.isLegacyExcelRecord) {
    return paymentActionError(
      formData,
      "Eski Excel kayıtlarında ödeme işlemi yapılamaz.",
    );
  }

  const paymentsTotal = await getPaymentsTotal(supabase, payment.transaction_id);

  if (paymentsTotal === null) {
    return paymentActionError(formData, "Ödeme kayıtları okunamadı.");
  }

  const adjustedTotal =
    paymentsTotal - Number(payment.amount ?? 0) + amount;

  if (adjustedTotal > transactionPaymentContext.saleAmount) {
    return paymentActionError(formData, PAYMENT_EXCEEDS_SALE_ERROR);
  }

  const { error } = await supabase
    .from("transaction_payments")
    .update({
      payment_date: paymentDate,
      payment_method: paymentMethod,
      amount,
      description: optionalText(formData.get("description")),
      received_by: optionalText(formData.get("received_by")),
    })
    .eq("id", paymentId);

  if (error) {
    return paymentActionError(formData, "Ödeme kaydı güncellenemedi.");
  }

  const receiptResult = await recreatePaymentReceiptDocument({
    supabase,
    transactionId: payment.transaction_id,
    paymentId,
    fallbackReceivedBy: email,
    createdByUserId: userId,
  });

  if (!receiptResult.ok) {
    console.error(receiptResult.error, {
      transactionId: payment.transaction_id,
      paymentId,
    });
    revalidatePaymentReceiptPaths(payment.transaction_id);
    return {
      ok: true,
      warning: "Ödeme güncellendi ancak makbuz yenilenemedi.",
    };
  }

  revalidatePaymentReceiptPaths(payment.transaction_id);
  return { ok: true };
}

export async function deleteTransactionPaymentAction(
  paymentId: string,
): Promise<PaymentActionResult> {
  if (!paymentId) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: payment, error: fetchError } = await supabase
    .from("transaction_payments")
    .select("transaction_id, receipt_document_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !payment) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  if (payment.receipt_document_id) {
    const receiptDeleteResult = await cleanupPaymentReceipt({
      supabase,
      paymentId,
      clearPaymentReference: true,
    });

    if (!receiptDeleteResult.ok) {
      console.error(receiptDeleteResult.error, {
        transactionId: payment.transaction_id,
        paymentId,
      });
      return { ok: false, error: PAYMENT_RECEIPT_DELETE_ERROR };
    }
  }

  const { error } = await supabase
    .from("transaction_payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    return { ok: false, error: "Ödeme kaydı silinemedi." };
  }

  revalidatePaymentReceiptPaths(payment.transaction_id);
  return { ok: true };
}

export async function regeneratePaymentReceiptAction(
  paymentId: string,
): Promise<PaymentActionResult> {
  if (!paymentId) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase, userId, email } = auth;
  const { data: payment, error: fetchError } = await supabase
    .from("transaction_payments")
    .select("transaction_id, receipt_document_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !payment) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  const transactionPaymentContext = await getTransactionSaleAmount(
    supabase,
    payment.transaction_id,
  );

  if (transactionPaymentContext === null) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  if (transactionPaymentContext.isLegacyExcelRecord) {
    return {
      ok: false,
      error: "Eski Excel kayıtlarında makbuz oluşturulamaz.",
    };
  }

  const receiptResult = payment.receipt_document_id
    ? await recreatePaymentReceiptDocument({
        supabase,
        transactionId: payment.transaction_id,
        paymentId,
        fallbackReceivedBy: email,
        createdByUserId: userId,
      })
    : await createPaymentReceiptDocument({
        supabase,
        transactionId: payment.transaction_id,
        paymentId,
        fallbackReceivedBy: email,
        createdByUserId: userId,
      });

  if (!receiptResult.ok) {
    return {
      ok: false,
      error: payment.receipt_document_id
        ? "Makbuz yeniden oluşturulamadı."
        : "Makbuz oluşturulamadı.",
    };
  }

  revalidatePaymentReceiptPaths(payment.transaction_id);
  return { ok: true };
}

export async function getPaymentReceiptUrlAction(
  paymentId: string,
): Promise<PaymentReceiptUrlResult> {
  if (!paymentId) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: payment, error: paymentError } = await supabase
    .from("transaction_payments")
    .select("receipt_document_id")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment?.receipt_document_id) {
    return { ok: false, error: "Makbuz bağlantısı oluşturulamadı." };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", payment.receipt_document_id)
    .single();

  if (documentError || !document?.file_path) {
    return { ok: false, error: "Makbuz bağlantısı oluşturulamadı." };
  }

  try {
    const url = await createR2SignedDownloadUrl(document.file_path, 300);
    return { ok: true, url };
  } catch (error) {
    console.error("Payment receipt signed URL failed", {
      paymentId,
      documentId: payment.receipt_document_id,
      error,
    });
    return { ok: false, error: "Makbuz bağlantısı oluşturulamadı." };
  }
}

export async function createTransactionReminderAction(
  transactionId: string,
  formData: FormData,
): Promise<ReminderActionResult> {
  if (!transactionId) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const dateResult = readRequiredReminderDate(formData.get("reminder_date"));

  if (!dateResult.ok) {
    return { ok: false, error: dateResult.error };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .select("id, transaction_no, patient_name, staff_name")
    .eq("id", transactionId)
    .single();

  if (transactionError || !transaction) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const lookupValues = getTransactionReminderLookupValues(transaction);
  const { data: existingReminder, error: existingError } = await supabase
    .from("reminders")
    .select("id")
    .in("related_record", lookupValues)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: "Hatırlatıcı kayıtları kontrol edilemedi." };
  }

  if (existingReminder) {
    return { ok: false, error: "Bu işlem için zaten bir hatırlatıcı var." };
  }

  const { error } = await supabase.from("reminders").insert({
    reminder_date: dateResult.value,
    reminder_time: null,
    title: "Hasta işlem hatırlatması",
    patient_name: transaction.patient_name,
    related_record: getTransactionRelatedRecord(transaction),
    responsible_person: transaction.staff_name,
    status: "pending",
    description: resolveReminderDescription(
      optionalText(formData.get("description")),
    ),
  });

  if (error) {
    return { ok: false, error: "Hatırlatıcı oluşturulamadı." };
  }

  revalidateTransactionReminderPaths(transactionId);
  return { ok: true };
}

export async function updateTransactionReminderAction(
  reminderId: string,
  transactionId: string,
  formData: FormData,
): Promise<ReminderActionResult> {
  if (!reminderId) {
    return { ok: false, error: "Hatırlatıcı kaydı bulunamadı." };
  }

  if (!transactionId) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const dateResult = readRequiredReminderDate(formData.get("reminder_date"));

  if (!dateResult.ok) {
    return { ok: false, error: dateResult.error };
  }

  const status = normalizeReminderStatus(formData.get("status"));

  if (!status) {
    return { ok: false, error: "Geçerli bir durum seçilmelidir." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .select("id, transaction_no")
    .eq("id", transactionId)
    .single();

  if (transactionError || !transaction) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const lookupValues = getTransactionReminderLookupValues(transaction);
  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("id, related_record")
    .eq("id", reminderId)
    .single();

  if (reminderError || !reminder) {
    return { ok: false, error: "Hatırlatıcı kaydı bulunamadı." };
  }

  if (
    !reminder.related_record ||
    !lookupValues.includes(reminder.related_record)
  ) {
    return { ok: false, error: "Hatırlatıcı bu işlemle ilişkili değil." };
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      reminder_date: dateResult.value,
      description: optionalText(formData.get("description")),
      status,
    })
    .eq("id", reminderId);

  if (error) {
    return { ok: false, error: "Hatırlatıcı güncellenemedi." };
  }

  revalidateTransactionReminderPaths(transactionId);
  return { ok: true };
}

async function deletePatientTransactionById(
  id: string,
): Promise<BulkDeleteActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase, email } = auth;
  if (!id) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (transactionError || !transaction) {
    return { ok: false, error: "İşlem kaydı bulunamadı." };
  }

  const receiptCleanupResult = await cleanupTransactionPaymentReceipts({
    supabase,
    transactionId: id,
  });

  if (!receiptCleanupResult.ok) {
    console.error(receiptCleanupResult.error, { transactionId: id });
    return { ok: false, error: TRANSACTION_RECEIPT_DELETE_ERROR };
  }

  const { data: existingReturns } = await supabase
    .from("stock_movements")
    .select("id")
    .eq("transaction_id", id)
    .eq("movement_type", "return")
    .limit(1);

  if (!existingReturns?.length) {
    const { data: deductionMovements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("stock_product_id, quantity_change, movement_type")
      .eq("transaction_id", id)
      .in("movement_type", ["sale", "out"])
      .lt("quantity_change", 0);

    if (movementsError) {
      return { ok: false, error: "Stok hareketleri okunamadı." };
    }

    if (deductionMovements?.length) {
      const returnMovements = deductionMovements.map((movement) => ({
        stock_product_id: movement.stock_product_id,
        movement_type: "return" as const,
        quantity_change: Math.abs(movement.quantity_change),
        transaction_id: id,
        staff_name: email ?? "Panel",
        note: "İşlem silindiği için stok iadesi",
      }));

      const { error: returnError } = await supabase
        .from("stock_movements")
        .insert(returnMovements);

      if (returnError) {
        return {
          ok: false,
          error: "Stok iadesi yapılamadığı için işlem silinmedi.",
        };
      }
    }
  }

  const { error } = await supabase.from("patient_transactions").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "İşlem kaydı silinemedi." };
  }

  revalidatePath("/panel/transactions");
  revalidatePath(`/panel/transactions/${id}`);
  revalidatePath("/panel/documents");
  revalidatePath("/panel/stock");
  revalidatePath("/panel/dashboard");
  revalidatePath("/panel/reports");
  return { ok: true };
}

export async function deletePatientTransaction(
  id: string,
): Promise<BulkDeleteActionResult> {
  return deletePatientTransactionById(id);
}

export async function deletePatientTransactions(
  ids: string[],
): Promise<BulkDeleteActionResult> {
  try {
    await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  return deleteRecordsSequentially(
    ids,
    deletePatientTransactionById,
    "işlem kayıtları silinemedi",
  );
}

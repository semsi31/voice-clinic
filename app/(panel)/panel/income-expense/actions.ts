"use server";

import { revalidatePath } from "next/cache";
import type { FinancePaymentMethod, FinanceRecordType } from "@/lib/finance";
import { extractFormValues } from "@/lib/panel-form";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { deleteRecordsInChunks } from "@/lib/supabase-bulk-delete";
import { optionalText, parseMoneyInput, readText } from "@/lib/transactions";

export type FinanceFormValues = {
  record_date: string;
  payment_method: string;
  amount: string;
  responsible_person: string;
  description: string;
};

const financeFormFields = [
  "record_date",
  "payment_method",
  "amount",
  "responsible_person",
  "description",
] as const;

const allowedTypes = new Set<FinanceRecordType>(["income", "expense"]);
const allowedPaymentMethods = new Set<FinancePaymentMethod>([
  "cash",
  "credit_card",
  "bank_transfer",
  "other",
]);

export type FinanceActionResult =
  | { ok: true }
  | { ok: false; error: string; values?: FinanceFormValues };

function normalizeType(value: FormDataEntryValue | null): FinanceRecordType | null {
  const type = readText(value);
  return allowedTypes.has(type as FinanceRecordType)
    ? (type as FinanceRecordType)
    : null;
}

function normalizePaymentMethod(
  value: FormDataEntryValue | null,
): FinancePaymentMethod | null {
  const method = readText(value);
  return allowedPaymentMethods.has(method as FinancePaymentMethod)
    ? (method as FinancePaymentMethod)
    : null;
}

function extractFinanceFormValues(formData: FormData): FinanceFormValues {
  return extractFormValues(formData, [...financeFormFields]) as FinanceFormValues;
}

function financeFormError(
  formData: FormData,
  error: string,
): { ok: false; error: string; values: FinanceFormValues } {
  return { ok: false, error, values: extractFinanceFormValues(formData) };
}

function validateFinancePayload(formData: FormData) {
  const recordDate = readText(formData.get("record_date"));
  const type = normalizeType(formData.get("type"));
  const paymentMethod = normalizePaymentMethod(formData.get("payment_method"));
  const amount = parseMoneyInput(formData.get("amount"));

  if (!recordDate) {
    return financeFormError(formData, "Tarih zorunludur.");
  }

  if (!type) {
    return financeFormError(formData, "Geçerli bir kayıt tipi seçilmelidir.");
  }

  if (!paymentMethod) {
    return financeFormError(formData, "Geçerli bir ödeme yöntemi seçilmelidir.");
  }

  if (amount <= 0) {
    return financeFormError(formData, "Tutar sıfırdan büyük olmalıdır.");
  }

  return {
    ok: true as const,
    data: {
      record_date: recordDate,
      type,
      payment_method: paymentMethod,
      amount,
      responsible_person: optionalText(formData.get("responsible_person")),
      description: optionalText(formData.get("description")),
    },
  };
}

export async function createFinanceRecord(
  _prevState: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult | undefined> {
  const validated = validateFinancePayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return financeFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, userId } = auth;
  const { error } = await supabase.from("finance_records").insert({
    ...validated.data,
    created_by: userId,
  });

  if (error) {
    return financeFormError(formData, "Kayıt oluşturulamadı.");
  }

  revalidatePath("/panel/income-expense");
  return { ok: true };
}

export async function updateFinanceRecord(
  _prevState: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult | undefined> {
  const id = readText(formData.get("id"));

  if (!id) {
    return financeFormError(formData, "Kayıt kimliği bulunamadı.");
  }

  const validated = validateFinancePayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return financeFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase } = auth;
  const { error } = await supabase
    .from("finance_records")
    .update(validated.data)
    .eq("id", id);

  if (error) {
    return financeFormError(formData, "Kayıt güncellenemedi.");
  }

  revalidatePath("/panel/income-expense");
  return { ok: true };
}

export async function deleteFinanceRecord(id: string): Promise<FinanceActionResult> {
  if (!id) {
    return { ok: false, error: "Kayıt kimliği bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await supabase.from("finance_records").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Kayıt silinemedi." };
  }

  revalidatePath("/panel/income-expense");
  return { ok: true };
}

export async function deleteFinanceRecords(
  ids: string[],
): Promise<FinanceActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  return deleteRecordsInChunks(
    supabase,
    "finance_records",
    ids,
    ["/panel/income-expense"],
    "kayıtlar silinemedi",
  );
}

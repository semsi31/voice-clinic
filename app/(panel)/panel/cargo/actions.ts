"use server";

import { revalidatePath } from "next/cache";
import type { CargoStatus } from "@/lib/cargo";
import { extractFormValues } from "@/lib/panel-form";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { deleteRecordsInChunks } from "@/lib/supabase-bulk-delete";
import { optionalText, readText } from "@/lib/transactions";

export type CargoFormValues = {
  cargo_date: string;
  sender_name: string;
  process_description: string;
  cargo_company: string;
  cargo_branch: string;
  tracking_number: string;
  status: string;
  note: string;
};

const cargoFormFields = [
  "cargo_date",
  "sender_name",
  "process_description",
  "cargo_company",
  "cargo_branch",
  "tracking_number",
  "status",
  "note",
] as const;

export type CargoActionResult =
  | { ok: true; deletedCount?: number }
  | { ok: false; error: string; deletedCount?: number; values?: CargoFormValues };

function normalizeStatus(value: FormDataEntryValue | null): CargoStatus | null {
  const status = readText(value);
  return allowedStatuses.has(status as CargoStatus)
    ? (status as CargoStatus)
    : null;
}

const allowedStatuses = new Set<CargoStatus>([
  "prepared",
  "shipped",
  "delivered",
  "returned",
  "problem",
]);

function cargoFormError(
  formData: FormData,
  error: string,
): { ok: false; error: string; values: CargoFormValues } {
  return {
    ok: false,
    error,
    values: extractFormValues(formData, [...cargoFormFields]) as CargoFormValues,
  };
}

function validateCargoPayload(formData: FormData) {
  const cargoDate = readText(formData.get("cargo_date"));
  const senderName = readText(formData.get("sender_name"));
  const processDescription = readText(formData.get("process_description"));
  const cargoCompany = readText(formData.get("cargo_company"));
  const status = normalizeStatus(formData.get("status"));

  if (!cargoDate) {
    return cargoFormError(formData, "Tarih zorunludur.");
  }

  if (!senderName) {
    return cargoFormError(formData, "Gönderen alanı zorunludur.");
  }

  if (!processDescription) {
    return cargoFormError(formData, "Yapılan işlem alanı zorunludur.");
  }

  if (!cargoCompany) {
    return cargoFormError(formData, "Kargo firması zorunludur.");
  }

  if (!status) {
    return cargoFormError(formData, "Geçerli bir durum seçilmelidir.");
  }

  return {
    ok: true as const,
    data: {
      cargo_date: cargoDate,
      sender_name: senderName,
      process_description: processDescription,
      cargo_company: cargoCompany,
      cargo_branch: optionalText(formData.get("cargo_branch")),
      tracking_number: optionalText(formData.get("tracking_number")),
      status,
      note: optionalText(formData.get("note")),
    },
  };
}

export async function createCargoRecord(
  _prevState: CargoActionResult | undefined,
  formData: FormData,
): Promise<CargoActionResult | undefined> {
  const validated = validateCargoPayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return cargoFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase, userId } = auth;
  const { error } = await supabase.from("cargo_records").insert({
    ...validated.data,
    created_by: userId,
  });

  if (error) {
    return cargoFormError(formData, "Kargo kaydı oluşturulamadı.");
  }

  revalidatePath("/panel/cargo");
  return { ok: true };
}

export async function updateCargoRecord(
  _prevState: CargoActionResult | undefined,
  formData: FormData,
): Promise<CargoActionResult | undefined> {
  const id = readText(formData.get("id"));

  if (!id) {
    return cargoFormError(formData, "Kayıt kimliği bulunamadı.");
  }

  const validated = validateCargoPayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return cargoFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase } = auth;
  const { error } = await supabase
    .from("cargo_records")
    .update(validated.data)
    .eq("id", id);

  if (error) {
    return cargoFormError(formData, "Kargo kaydı güncellenemedi.");
  }

  revalidatePath("/panel/cargo");
  return { ok: true };
}

export async function deleteCargoRecord(id: string): Promise<CargoActionResult> {
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
  const { data, error } = await supabase
    .from("cargo_records")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { ok: false, error: "Kargo kaydı silinemedi." };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: "Kargo kaydı bulunamadı veya silinemedi." };
  }

  revalidatePath("/panel/cargo");
  return { ok: true, deletedCount: data.length };
}

export async function deleteCargoRecords(
  ids: string[],
): Promise<CargoActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  return deleteRecordsInChunks(
    supabase,
    "cargo_records",
    ids,
    ["/panel/cargo"],
    "kargo kayıtları silinemedi",
  );
}

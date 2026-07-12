"use server";

import { revalidatePath } from "next/cache";
import type { ReminderStatus } from "@/lib/reminders";
import { extractFormValues } from "@/lib/panel-form";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { deleteRecordsInChunks } from "@/lib/supabase-bulk-delete";
import { optionalText, readText } from "@/lib/transactions";

export type ReminderFormValues = {
  reminder_date: string;
  reminder_time: string;
  title: string;
  patient_name: string;
  related_record: string;
  status: string;
  responsible_person: string;
  description: string;
};

const reminderFormFields = [
  "reminder_date",
  "reminder_time",
  "title",
  "patient_name",
  "related_record",
  "status",
  "responsible_person",
  "description",
] as const;

export type ReminderActionResult =
  | { ok: true }
  | { ok: false; error: string; values?: ReminderFormValues };

function normalizeStatus(value: FormDataEntryValue | null): ReminderStatus | null {
  const status = readText(value);
  return allowedStatuses.has(status as ReminderStatus)
    ? (status as ReminderStatus)
    : null;
}

function optionalTime(value: FormDataEntryValue | null): string | null {
  const time = readText(value);
  return time.length > 0 ? time : null;
}

const allowedStatuses = new Set<ReminderStatus>([
  "pending",
  "completed",
  "delayed",
  "cancelled",
]);

function reminderFormError(
  formData: FormData,
  error: string,
): { ok: false; error: string; values: ReminderFormValues } {
  return {
    ok: false,
    error,
    values: extractFormValues(formData, [...reminderFormFields]) as ReminderFormValues,
  };
}

function validateReminderPayload(formData: FormData) {
  const reminderDate = readText(formData.get("reminder_date"));
  const title = readText(formData.get("title"));
  const status = normalizeStatus(formData.get("status"));

  if (!reminderDate) {
    return reminderFormError(formData, "Hatırlatma tarihi zorunludur.");
  }

  if (!title) {
    return reminderFormError(formData, "Başlık zorunludur.");
  }

  if (!status) {
    return reminderFormError(formData, "Geçerli bir durum seçilmelidir.");
  }

  return {
    ok: true as const,
    data: {
      reminder_date: reminderDate,
      reminder_time: optionalTime(formData.get("reminder_time")),
      title,
      patient_name: optionalText(formData.get("patient_name")),
      related_record: optionalText(formData.get("related_record")),
      responsible_person: optionalText(formData.get("responsible_person")),
      status,
      description: optionalText(formData.get("description")),
    },
  };
}

export async function createReminderAction(
  _prevState: ReminderActionResult | undefined,
  formData: FormData,
): Promise<ReminderActionResult | undefined> {
  const validated = validateReminderPayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return reminderFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase } = auth;
  const { error } = await supabase.from("reminders").insert(validated.data);

  if (error) {
    return reminderFormError(formData, "Hatırlatıcı oluşturulamadı.");
  }

  revalidatePath("/panel/reminders");
  return { ok: true };
}

export async function updateReminderAction(
  _prevState: ReminderActionResult | undefined,
  formData: FormData,
): Promise<ReminderActionResult | undefined> {
  const id = readText(formData.get("id"));

  if (!id) {
    return reminderFormError(formData, "Kayıt kimliği bulunamadı.");
  }

  const validated = validateReminderPayload(formData);

  if (!validated.ok) {
    return validated;
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return reminderFormError(formData, getPanelAuthErrorMessage(error));
  }

  const { supabase } = auth;
  const { error } = await supabase
    .from("reminders")
    .update(validated.data)
    .eq("id", id);

  if (error) {
    return reminderFormError(formData, "Hatırlatıcı güncellenemedi.");
  }

  revalidatePath("/panel/reminders");
  return { ok: true };
}

export async function deleteReminderAction(
  id: string,
): Promise<ReminderActionResult> {
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
  const { error } = await supabase.from("reminders").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Hatırlatıcı silinemedi." };
  }

  revalidatePath("/panel/reminders");
  return { ok: true };
}

export async function deleteReminderRecords(
  ids: string[],
): Promise<ReminderActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  return deleteRecordsInChunks(
    supabase,
    "reminders",
    ids,
    ["/panel/reminders", "/panel/dashboard"],
    "hatırlatıcılar silinemedi",
  );
}

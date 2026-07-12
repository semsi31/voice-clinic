"use server";

import { revalidatePath } from "next/cache";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { deleteRecordsInChunks } from "@/lib/supabase-bulk-delete";

const allowedStatuses = new Set(["new", "contacted", "completed", "cancelled"]);

export type RequestActionResult =
  | { ok: true; deletedCount?: number }
  | { ok: false; error: string; deletedCount?: number };

export async function updateWebRequestStatus(
  id: string,
  status: string,
  statusNote: string,
): Promise<RequestActionResult> {
  if (!id) {
    return { ok: false, error: "Talep kaydı bulunamadı." };
  }

  if (!allowedStatuses.has(status)) {
    return { ok: false, error: "Geçersiz durum seçimi." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await supabase
    .from("web_requests")
    .update({
      status,
      status_note: statusNote.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Talep durumu güncellenemedi." };
  }

  revalidatePath("/panel/requests");
  return { ok: true };
}

export async function deleteWebRequest(
  id: string,
): Promise<RequestActionResult> {
  if (!id) {
    return { ok: false, error: "Talep kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await supabase.from("web_requests").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Talep silinemedi." };
  }

  revalidatePath("/panel/requests");
  return { ok: true };
}

export async function deleteWebRequests(
  ids: string[],
): Promise<RequestActionResult> {
  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  return deleteRecordsInChunks(
    supabase,
    "web_requests",
    ids,
    ["/panel/requests"],
    "talepler silinemedi",
  );
}

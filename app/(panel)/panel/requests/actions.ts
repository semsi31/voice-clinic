"use server";

import { revalidatePath } from "next/cache";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import { createMutationTimer } from "@/lib/mutation-timing";
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
  const timer = createMutationTimer({ name: "updateWebRequestStatus" });

  if (!id) {
    return { ok: false, error: "Talep kaydı bulunamadı." };
  }

  if (!allowedStatuses.has(status)) {
    return { ok: false, error: "Geçersiz durum seçimi." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await timer.timeAuth(() => requireActivePanelUser());
  } catch (error) {
    timer.end({ error: "auth" });
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await timer.timeDb(() =>
    supabase
      .from("web_requests")
      .update({
        status,
        status_note: statusNote.trim() || null,
      })
      .eq("id", id),
  );

  if (error) {
    timer.end({ error: "update" });
    return { ok: false, error: "Talep durumu güncellenemedi." };
  }

  await timer.timeRevalidate(() => {
    revalidatePath("/panel/requests");
  });
  timer.end();
  return { ok: true };
}

export async function deleteWebRequest(
  id: string,
): Promise<RequestActionResult> {
  const timer = createMutationTimer({ name: "deleteWebRequest" });

  if (!id) {
    return { ok: false, error: "Talep kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await timer.timeAuth(() => requireActivePanelUser());
  } catch (error) {
    timer.end({ error: "auth" });
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { error } = await timer.timeDb(() =>
    supabase.from("web_requests").delete().eq("id", id),
  );

  if (error) {
    timer.end({ error: "delete" });
    return { ok: false, error: "Talep silinemedi." };
  }

  await timer.timeRevalidate(() => {
    revalidatePath("/panel/requests");
  });
  timer.end();
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

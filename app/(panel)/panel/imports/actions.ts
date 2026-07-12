"use server";

import { revalidatePath } from "next/cache";
import {
  getExcelImportStaffName,
  validateImportRows,
  type ImportPreviewRow,
  type ImportResultSummary,
  type NormalizedImportRow,
} from "@/lib/import";
import {
  LEGACY_ACTIVITY_SHEET_NAMES,
  normalizeLegacyActivityRow,
  parseLegacyActivityDate,
  type LegacyActivityImportSummary,
  type LegacyActivityPreviewSheetSummary,
  type LegacyActivityPreviewSummary,
  type LegacyActivityRawRow,
  type LegacyActivitySheetName,
  type LegacyActivitySheetPayload,
} from "@/lib/legacy-activity-import";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
} from "@/lib/panel-auth";
import type { createClient } from "@/lib/supabase/server";

export type ImportPreviewActionResult =
  | {
      ok: true;
      batchId: string;
      totalRows: number;
      validRows: number;
      failedRows: number;
      previewRows: ImportPreviewRow[];
    }
  | { ok: false; error: string };

export type ImportExecuteActionResult =
  | {
      ok: true;
      summary: ImportResultSummary;
    }
  | { ok: false; error: string };

export type LegacyActivityPreviewActionResult =
  | {
      ok: true;
      summary: LegacyActivityPreviewSummary;
    }
  | { ok: false; error: string };

export type LegacyActivityImportActionResult =
  | {
      ok: true;
      summary: LegacyActivityImportSummary;
    }
  | { ok: false; error: string };

export type LegacyActivityDateCorrection = {
  sheetName: LegacyActivitySheetName;
  rowNumber: number;
  correctedDate: string;
};

const legacySkipReasonMessages = {
  missing_patient: "Hasta adı boş olduğu için aktarılmadı.",
  financial: "Gider, gelir, tahsilat veya ödeme satırı olduğu için aktarılmadı.",
  invalid_date: "Tarih geçersiz olduğu için aktarılmadı.",
  missing_content: "Yapılan işlem ve not boş olduğu için aktarılmadı.",
  duplicate: "Bu sheet ve satır numarası daha önce aktarılmış.",
} as const;

const legacySheetNameSet = new Set<string>(LEGACY_ACTIVITY_SHEET_NAMES);

function isAllowedLegacySheetName(value: string): value is LegacyActivitySheetName {
  return legacySheetNameSet.has(value);
}

function legacyDuplicateKey(sheetName: string | null, rowNumber: number | null) {
  return sheetName && rowNumber ? `${sheetName}:${rowNumber}` : null;
}

async function getExistingLegacyRowKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("patient_transactions")
    .select("legacy_sheet_name, legacy_row_number")
    .eq("source_type", "legacy_excel")
    .in("legacy_sheet_name", [...LEGACY_ACTIVITY_SHEET_NAMES]);

  const keys = new Set<string>();

  for (const row of data ?? []) {
    const key = legacyDuplicateKey(
      row.legacy_sheet_name as string | null,
      row.legacy_row_number as number | null,
    );
    if (key) {
      keys.add(key);
    }
  }

  return keys;
}

function createEmptyLegacySheetSummary(
  sheetName: LegacyActivitySheetName,
): LegacyActivityPreviewSheetSummary {
  return {
    sheetName,
    totalRows: 0,
    importableRows: 0,
    missingPatientRows: 0,
    financialRows: 0,
    invalidDateRows: 0,
    missingContentRows: 0,
    duplicateRows: 0,
  };
}

function incrementLegacySkipCount(
  summary: LegacyActivityPreviewSheetSummary,
  reason: keyof typeof legacySkipReasonMessages,
) {
  if (reason === "missing_patient") summary.missingPatientRows += 1;
  if (reason === "financial") summary.financialRows += 1;
  if (reason === "invalid_date") summary.invalidDateRows += 1;
  if (reason === "missing_content") summary.missingContentRows += 1;
  if (reason === "duplicate") summary.duplicateRows += 1;
}

async function insertImportRowsInChunks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Array<{
    batch_id: string;
    row_number: number;
    raw_data: Record<string, unknown>;
    normalized_data: Record<string, unknown> | null;
    status: "valid" | "invalid";
    error_message: string | null;
  }>,
) {
  const chunkSize = 1000;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from("import_rows").insert(chunk);

    if (error) {
      return error;
    }
  }

  return null;
}

type LegacyImportRowRecord = {
  id: string;
  row_number: number;
  raw_data: unknown;
  normalized_data: unknown;
  status: string;
  error_message: string | null;
  transaction_id?: string | null;
};

async function fetchLegacyImportRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
): Promise<{ rows: LegacyImportRowRecord[]; error: string | null }> {
  const pageSize = 1000;
  const rows: LegacyImportRowRecord[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("import_rows")
      .select(
        "id, row_number, raw_data, normalized_data, status, error_message, transaction_id",
      )
      .eq("batch_id", batchId)
      .order("row_number", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return { rows: [], error: error.message };
    }

    const chunk = (data ?? []) as LegacyImportRowRecord[];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
  }

  return { rows, error: null };
}

export async function previewLegacyActivityImportAction(
  fileName: string,
  sheets: LegacyActivitySheetPayload[],
): Promise<LegacyActivityPreviewActionResult> {
  if (!fileName.trim()) {
    return { ok: false, error: "Dosya adı bulunamadı." };
  }

  if (!Array.isArray(sheets) || sheets.length === 0) {
    return { ok: false, error: "İşlenecek legacy sheet verisi bulunamadı." };
  }

  if (sheets.some((sheet) => !isAllowedLegacySheetName(sheet.sheetName))) {
    return {
      ok: false,
      error: "Bu aktarım yalnızca 2018 ve YENİ FAALİYETT sheetlerini işler.",
    };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase, userId } = auth;
  const existingKeys = await getExistingLegacyRowKeys(supabase);
  const summaries = new Map(
    LEGACY_ACTIVITY_SHEET_NAMES.map((sheetName) => [
      sheetName,
      createEmptyLegacySheetSummary(sheetName),
    ]),
  );
  const examples: LegacyActivityPreviewSummary["examples"] = [];
  const importRows: Array<{
    batch_id: string;
    row_number: number;
    raw_data: Record<string, unknown>;
    normalized_data: Record<string, unknown> | null;
    status: "valid" | "invalid";
    error_message: string | null;
  }> = [];

  const normalizedRows: Array<{
    sheetName: LegacyActivitySheetName;
    row: LegacyActivityRawRow;
    normalized: ReturnType<typeof normalizeLegacyActivityRow>;
  }> = [];

  for (const sheet of sheets) {
    const summary = summaries.get(sheet.sheetName);
    if (!summary) {
      continue;
    }

    summary.totalRows = sheet.totalRows;

    for (const row of sheet.rows) {
      const normalized = normalizeLegacyActivityRow(
        sheet.sheetName,
        row,
        existingKeys,
      );

      normalizedRows.push({ sheetName: sheet.sheetName, row, normalized });

      if (normalized.status === "valid") {
        summary.importableRows += 1;
        if (examples.length < 50) {
          examples.push(normalized.preview);
        }
      } else {
        incrementLegacySkipCount(summary, normalized.reason);
      }
    }
  }

  const sheetSummaries = [...summaries.values()];
  const totalRows = sheetSummaries.reduce((total, sheet) => total + sheet.totalRows, 0);
  const importableRows = sheetSummaries.reduce(
    (total, sheet) => total + sheet.importableRows,
    0,
  );

  if (totalRows === 0) {
    return {
      ok: false,
      error: "2018 veya YENİ FAALİYETT sheetlerinde okunacak satır bulunamadı.",
    };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      file_name: `Eski Faaliyet Aktarımı: ${fileName.trim()}`,
      status: "preview",
      total_rows: totalRows,
      valid_rows: importableRows,
      failed_rows: totalRows - importableRows,
      uploaded_by: userId,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return { ok: false, error: "Ön izleme kaydı oluşturulamadı." };
  }

  for (const item of normalizedRows) {
    const normalizedData =
      item.normalized.status === "valid" ? item.normalized.preview : null;
    const errorMessage =
      item.normalized.status === "skipped"
        ? legacySkipReasonMessages[item.normalized.reason]
        : null;

    importRows.push({
      batch_id: batch.id,
      row_number: item.row.rowNumber,
      raw_data: {
        sheetName: item.sheetName,
        rowNumber: item.row.rowNumber,
        values: item.row.values,
      },
      normalized_data: normalizedData,
      status: item.normalized.status === "valid" ? "valid" : "invalid",
      error_message: errorMessage,
    });
  }

  const rowsError = await insertImportRowsInChunks(supabase, importRows);

  if (rowsError) {
    await supabase.from("import_batches").delete().eq("id", batch.id);
    return { ok: false, error: "Ön izleme satırları kaydedilemedi." };
  }

  return {
    ok: true,
    summary: {
      batchId: batch.id,
      fileName: fileName.trim(),
      sheets: sheetSummaries,
      totalRows,
      importableRows,
      missingPatientRows: sheetSummaries.reduce(
        (total, sheet) => total + sheet.missingPatientRows,
        0,
      ),
      financialRows: sheetSummaries.reduce(
        (total, sheet) => total + sheet.financialRows,
        0,
      ),
      invalidDateRows: sheetSummaries.reduce(
        (total, sheet) => total + sheet.invalidDateRows,
        0,
      ),
      missingContentRows: sheetSummaries.reduce(
        (total, sheet) => total + sheet.missingContentRows,
        0,
      ),
      duplicateRows: sheetSummaries.reduce(
        (total, sheet) => total + sheet.duplicateRows,
        0,
      ),
      examples,
      invalidDateReviewRows: [],
    },
  };
}

export async function executeLegacyActivityImportAction(
  batchId: string,
  dateCorrections: LegacyActivityDateCorrection[] = [],
): Promise<LegacyActivityImportActionResult> {
  if (!batchId) {
    return { ok: false, error: "Preview kaydı bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .select("id, status, file_name")
    .eq("id", batchId)
    .single();

  if (batchError || !batch) {
    return { ok: false, error: "Preview kaydı bulunamadı." };
  }

  if (!String(batch.file_name ?? "").startsWith("Eski Faaliyet Aktarımı:")) {
    return { ok: false, error: "Bu kayıt eski faaliyet aktarımı için değil." };
  }

  if (!["preview", "importing", "completed", "failed"].includes(batch.status)) {
    return { ok: false, error: "Bu aktarım işlenemez durumda." };
  }

  const rowsResult = await fetchLegacyImportRows(supabase, batchId);

  if (rowsResult.error) {
    return {
      ok: false,
      error: `Aktarılacak preview satırları okunamadı: ${rowsResult.error}`,
    };
  }

  const rows = rowsResult.rows;

  const corrections = new Map<string, string>();
  for (const correction of dateCorrections) {
    const correctedDate = parseLegacyActivityDate(correction.correctedDate);
    if (correctedDate) {
      corrections.set(
        legacyDuplicateKey(correction.sheetName, correction.rowNumber) ?? "",
        correctedDate,
      );
    }
  }

  const totalPreviewImportableRows = rows.filter((row) => {
    if (row.status === "valid" || row.status === "imported") {
      return true;
    }

    if (
      row.status === "invalid" &&
      typeof row.error_message === "string" &&
      row.error_message.includes(legacySkipReasonMessages.duplicate)
    ) {
      return true;
    }

    return false;
  }).length;

  const alreadyImportedRows = rows.filter((row) => row.status === "imported").length;
  const previewDuplicateRows = rows.filter(
    (row) =>
      row.status === "invalid" &&
      typeof row.error_message === "string" &&
      row.error_message.includes(legacySkipReasonMessages.duplicate),
  ).length;
  const importableRows = rows.filter((row) => {
    if (row.status === "valid") {
      return true;
    }

    const rawData = row.raw_data as
      | { sheetName?: string; rowNumber?: number }
      | null;
    const key = legacyDuplicateKey(
      rawData?.sheetName ?? null,
      rawData?.rowNumber ?? null,
    );

    return Boolean(key && corrections.has(key));
  });

  if (importableRows.length === 0) {
    if (alreadyImportedRows > 0) {
      return {
        ok: true,
        summary: {
          importedRows: 0,
          totalPreviewImportableRows,
          totalSubmittedRows: alreadyImportedRows + previewDuplicateRows,
          newlyInsertedRows: 0,
          normalImportedRows: 0,
          correctedDateImportedRows: 0,
          uncorrectedInvalidDateRows: 0,
          duplicateRows: alreadyImportedRows + previewDuplicateRows,
          failedRows: 0,
        },
      };
    }

    return { ok: false, error: "Aktarılabilir hasta faaliyet satırı yok." };
  }

  await supabase
    .from("import_batches")
    .update({ status: "importing" })
    .eq("id", batchId);

  let importedRows = 0;
  let newlyInsertedRows = 0;
  let normalImportedRows = 0;
  let correctedDateImportedRows = 0;
  const uncorrectedInvalidDateRows = rows.filter((row) => {
    if (row.status !== "invalid") {
      return false;
    }

    if (
      typeof row.error_message !== "string" ||
      !row.error_message.includes("Tarih geçersiz")
    ) {
      return false;
    }

    const rawData = row.raw_data as
      | { sheetName?: string; rowNumber?: number }
      | null;
    const key = legacyDuplicateKey(
      rawData?.sheetName ?? null,
      rawData?.rowNumber ?? null,
    );

    return !key || !corrections.has(key);
  }).length;
  let duplicateRows = alreadyImportedRows + previewDuplicateRows;
  let failedRows = 0;
  const existingKeys = await getExistingLegacyRowKeys(supabase);

  for (const row of importableRows) {
    let normalized =
      row.normalized_data as LegacyActivityPreviewSummary["examples"][number] | null;
    let isCorrectedDateRow = false;
    let rawDateForCorrection: string | null = null;

    if (row.status !== "valid") {
      const rawData = row.raw_data as
        | {
            sheetName?: LegacyActivitySheetName;
            rowNumber?: number;
            values?: LegacyActivityRawRow["values"];
          }
        | null;
      const key = legacyDuplicateKey(
        rawData?.sheetName ?? null,
        rawData?.rowNumber ?? null,
      );
      const correctedDate = key ? corrections.get(key) : null;

      if (!rawData?.sheetName || !rawData.rowNumber || !rawData.values || !correctedDate) {
        failedRows += 1;
        await supabase
          .from("import_rows")
          .update({
            status: "failed",
            error_message: "Düzeltilmiş tarih verisi okunamadı.",
          })
          .eq("id", row.id);
        continue;
      }

      rawDateForCorrection =
        rawData.values.date == null ? "" : String(rawData.values.date).trim();
      const correctedRawRow: LegacyActivityRawRow = {
        rowNumber: rawData.rowNumber,
        values: {
          ...rawData.values,
          date: correctedDate,
        },
      };
      const correctedNormalized = normalizeLegacyActivityRow(
        rawData.sheetName,
        correctedRawRow,
      );

      if (correctedNormalized.status !== "valid") {
        failedRows += 1;
        await supabase
          .from("import_rows")
          .update({
            status: "failed",
            error_message: "Düzeltilmiş tarihli satır doğrulanamadı.",
          })
          .eq("id", row.id);
        continue;
      }

      normalized = correctedNormalized.preview;
      isCorrectedDateRow = true;
    }

    if (!normalized) {
      failedRows += 1;
      await supabase
        .from("import_rows")
        .update({ status: "failed", error_message: "Normalize veri bulunamadı." })
        .eq("id", row.id);
      continue;
    }

    const correctionNote =
      isCorrectedDateRow
        ? `[Tarih manuel düzeltildi. Excel ham tarih: ${rawDateForCorrection || "-"}]`
        : null;
    const finalNotes = correctionNote
      ? normalized.notes
        ? `${normalized.notes}\n${correctionNote}`
        : correctionNote
      : normalized.notes;

    const existingKey = legacyDuplicateKey(
      normalized.sheetName,
      normalized.rowNumber,
    );

    if (existingKey && existingKeys.has(existingKey)) {
      duplicateRows += 1;
      await supabase
        .from("import_rows")
        .update({
          status: "invalid",
          error_message: legacySkipReasonMessages.duplicate,
        })
        .eq("id", row.id);
      continue;
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("patient_transactions")
      .insert({
        patient_name: normalized.patientName,
        patient_phone: null,
        description: finalNotes,
        branch: null,
        transaction_date: normalized.transactionDate,
        hospital: null,
        doctor_name: null,
        reference_source: normalized.sender,
        operation_description: normalized.operationDescription,
        staff_name: null,
        brand: null,
        model: null,
        serial_no: null,
        ear_side: null,
        sale_amount: 0,
        paid_amount: 0,
        remaining_debt: 0,
        stock_deduct_enabled: false,
        stock_product_id: null,
        stock_product_label: null,
        stock_quantity: null,
        notes: finalNotes,
        source_type: "legacy_excel",
        legacy_sheet_name: normalized.sheetName,
        legacy_row_number: normalized.rowNumber,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      const isDuplicateError =
        transactionError?.code === "23505" ||
        String(transactionError?.message ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes("duplicate");

      if (isDuplicateError) {
        duplicateRows += 1;
        await supabase
          .from("import_rows")
          .update({
            status: "invalid",
            error_message: legacySkipReasonMessages.duplicate,
          })
          .eq("id", row.id);
        continue;
      }

      failedRows += 1;
      await supabase
        .from("import_rows")
        .update({
          status: "failed",
          error_message: "Hasta işlem kaydı oluşturulamadı.",
        })
        .eq("id", row.id);
      continue;
    }

    importedRows += 1;
    newlyInsertedRows += 1;
    if (isCorrectedDateRow) {
      correctedDateImportedRows += 1;
    } else {
      normalImportedRows += 1;
    }
    if (existingKey) {
      existingKeys.add(existingKey);
    }
    await supabase
      .from("import_rows")
      .update({
        status: "imported",
        transaction_id: transaction.id,
        error_message: null,
      })
      .eq("id", row.id);
  }

  await supabase
    .from("import_batches")
    .update({
      status: failedRows > 0 ? "failed" : "completed",
      success_rows: importedRows + alreadyImportedRows,
      failed_rows: failedRows + duplicateRows + uncorrectedInvalidDateRows,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  revalidatePath("/panel/imports");
  revalidatePath("/panel/transactions");
  revalidatePath("/panel/dashboard");

  if (failedRows > 0) {
    return {
      ok: false,
      error: `${failedRows} satır aktarılırken hata oluştu.`,
    };
  }

  return {
    ok: true,
    summary: {
      importedRows,
      totalPreviewImportableRows,
      totalSubmittedRows:
        importableRows.length + alreadyImportedRows + previewDuplicateRows,
      newlyInsertedRows,
      normalImportedRows,
      correctedDateImportedRows,
      uncorrectedInvalidDateRows,
      duplicateRows,
      failedRows,
    },
  };
}

export async function previewImportAction(
  fileName: string,
  rows: Record<string, unknown>[],
): Promise<ImportPreviewActionResult> {
  if (!fileName.trim()) {
    return { ok: false, error: "Dosya adı bulunamadı." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Excel dosyasında işlenecek satır bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase, userId } = auth;
  const validation = validateImportRows(rows);

  if (validation.totalRows === 0) {
    return { ok: false, error: "Excel dosyasında veri satırı bulunamadı." };
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      file_name: fileName.trim(),
      status: "preview",
      total_rows: validation.totalRows,
      valid_rows: validation.validRows,
      failed_rows: validation.failedRows,
      uploaded_by: userId,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return { ok: false, error: "Ön izleme kaydı oluşturulamadı." };
  }

  const importRows = validation.results.map((result) => ({
    batch_id: batch.id,
    row_number: result.preview.rowNumber,
    raw_data: result.rawData,
    normalized_data: result.normalized,
    status: result.status,
    error_message: result.preview.errorMessage,
  }));

  const { error: rowsError } = await supabase.from("import_rows").insert(importRows);

  if (rowsError) {
    await supabase.from("import_batches").delete().eq("id", batch.id);
    return { ok: false, error: "Ön izleme satırları kaydedilemedi." };
  }

  return {
    ok: true,
    batchId: batch.id,
    totalRows: validation.totalRows,
    validRows: validation.validRows,
    failedRows: validation.failedRows,
    previewRows: validation.results.map((result) => result.preview),
  };
}

async function createPaymentsForRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactionId: string,
  normalized: NormalizedImportRow,
) {
  const staffName = normalized.staff_name ?? getExcelImportStaffName();
  const payments: {
    transaction_id: string;
    payment_date: string;
    payment_method: "cash" | "credit_card" | "bank_transfer";
    amount: number;
    received_by: string;
    description: string;
  }[] = [];

  if (normalized.cash > 0) {
    payments.push({
      transaction_id: transactionId,
      payment_date: normalized.transaction_date,
      payment_method: "cash",
      amount: normalized.cash,
      received_by: staffName,
      description: "Excel import nakit ödemesi",
    });
  }

  if (normalized.credit_card > 0) {
    payments.push({
      transaction_id: transactionId,
      payment_date: normalized.transaction_date,
      payment_method: "credit_card",
      amount: normalized.credit_card,
      received_by: staffName,
      description: "Excel import kredi kartı ödemesi",
    });
  }

  if (normalized.bank_transfer > 0) {
    payments.push({
      transaction_id: transactionId,
      payment_date: normalized.transaction_date,
      payment_method: "bank_transfer",
      amount: normalized.bank_transfer,
      received_by: staffName,
      description: "Excel import havale ödemesi",
    });
  }

  if (payments.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("transaction_payments").insert(payments);

  if (error) {
    throw new Error("Ödeme kayıtları oluşturulamadı.");
  }

  return payments.length;
}

type ImportRowRollbackState = {
  transactionId: string | null;
  reminderId: string | null;
};

async function rollbackImportRowCreates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  state: ImportRowRollbackState,
): Promise<string | null> {
  const cleanupErrors: string[] = [];

  if (state.reminderId) {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", state.reminderId);

    if (error) {
      cleanupErrors.push("Hatırlatıcı geri alınamadı.");
    }
  }

  if (state.transactionId) {
    const { error: paymentsError } = await supabase
      .from("transaction_payments")
      .delete()
      .eq("transaction_id", state.transactionId);

    if (paymentsError) {
      cleanupErrors.push("Ödeme kayıtları geri alınamadı.");
    }

    const { error: transactionError } = await supabase
      .from("patient_transactions")
      .delete()
      .eq("id", state.transactionId);

    if (transactionError) {
      cleanupErrors.push("İşlem kaydı geri alınamadı.");
    }
  }

  return cleanupErrors.length > 0 ? cleanupErrors.join(" ") : null;
}

export async function executeImportAction(
  batchId: string,
): Promise<ImportExecuteActionResult> {
  if (!batchId) {
    return { ok: false, error: "Batch kimliği bulunamadı." };
  }

  let auth: Awaited<ReturnType<typeof requireActivePanelUser>>;
  try {
    auth = await requireActivePanelUser();
  } catch (error) {
    return { ok: false, error: getPanelAuthErrorMessage(error) };
  }

  const { supabase } = auth;
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .select("id, status, failed_rows")
    .eq("id", batchId)
    .single();

  if (batchError || !batch) {
    return { ok: false, error: "İçe aktarım kaydı bulunamadı." };
  }

  if (batch.status !== "preview") {
    return { ok: false, error: "Bu içe aktarım zaten işlenmiş." };
  }

  if ((batch.failed_rows ?? 0) > 0) {
    return {
      ok: false,
      error: "Hatalı satırlar düzeltilmeden içe aktarım yapılamaz.",
    };
  }

  const { data: importRows, error: rowsError } = await supabase
    .from("import_rows")
    .select("id, row_number, raw_data, normalized_data, status")
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (rowsError || !importRows?.length) {
    return { ok: false, error: "İçe aktarılacak satır bulunamadı." };
  }

  await supabase
    .from("import_batches")
    .update({ status: "importing" })
    .eq("id", batchId);

  let transactionsCreated = 0;
  let paymentsCreated = 0;
  let remindersCreated = 0;
  let importedRows = 0;
  let failedRows = 0;

  for (const importRow of importRows) {
    const serverValidation = validateImportRows([
      importRow.raw_data as Record<string, unknown>,
    ]);

    const validation = serverValidation.results[0];

    if (!validation || validation.status !== "valid" || !validation.normalized) {
      failedRows += 1;
      await supabase
        .from("import_rows")
        .update({
          status: "failed",
          transaction_id: null,
          error_message:
            validation?.preview.errorMessage ?? "Satır doğrulaması başarısız.",
        })
        .eq("id", importRow.id);
      continue;
    }

    const normalized = validation.normalized;
    const rollbackState: ImportRowRollbackState = {
      transactionId: null,
      reminderId: null,
    };

    try {
      const { data: transaction, error: transactionError } = await supabase
        .from("patient_transactions")
        .insert({
          patient_name: normalized.patient_name,
          patient_phone: normalized.patient_phone,
          branch: normalized.branch,
          transaction_date: normalized.transaction_date,
          hospital: normalized.hospital,
          doctor_name: normalized.doctor_name,
          reference_source: normalized.reference_source,
          operation_description: normalized.operation_description,
          brand: normalized.brand,
          model: normalized.model,
          serial_no: normalized.serial_no,
          ear_side: normalized.ear_side,
          sale_amount: normalized.sale_amount,
          notes: normalized.notes,
          staff_name: normalized.staff_name ?? getExcelImportStaffName(),
          stock_deduct_enabled: false,
          stock_product_id: null,
          stock_product_label: null,
          stock_quantity: null,
        })
        .select("id, transaction_no")
        .single();

      if (transactionError || !transaction) {
        throw new Error("Hasta işlem kaydı oluşturulamadı.");
      }

      rollbackState.transactionId = transaction.id;

      const paymentCount = await createPaymentsForRow(
        supabase,
        transaction.id,
        normalized,
      );

      if (normalized.reminder_date) {
        const { data: reminder, error: reminderError } = await supabase
          .from("reminders")
          .insert({
            reminder_date: normalized.reminder_date,
            title: "Excel import hatırlatması",
            patient_name: normalized.patient_name,
            related_record: transaction.transaction_no ?? transaction.id,
            responsible_person: normalized.staff_name ?? getExcelImportStaffName(),
            status: "pending",
            description:
              normalized.reminder_description ??
              normalized.notes ??
              "Excel import ile oluşturuldu",
          })
          .select("id")
          .single();

        if (reminderError || !reminder) {
          throw new Error("Hatırlatıcı kaydı oluşturulamadı.");
        }

        rollbackState.reminderId = reminder.id;
      }

      await supabase
        .from("import_rows")
        .update({
          status: "imported",
          normalized_data: normalized,
          transaction_id: transaction.id,
          error_message: null,
        })
        .eq("id", importRow.id);

      transactionsCreated += 1;
      paymentsCreated += paymentCount;
      if (rollbackState.reminderId) {
        remindersCreated += 1;
      }
      importedRows += 1;
    } catch (error) {
      const cleanupError = await rollbackImportRowCreates(supabase, rollbackState);
      failedRows += 1;

      const baseMessage =
        error instanceof Error
          ? error.message
          : "Satır içe aktarılırken hata oluştu.";
      const errorMessage = cleanupError
        ? `${baseMessage} ${cleanupError}`
        : baseMessage;

      await supabase
        .from("import_rows")
        .update({
          status: "failed",
          transaction_id: null,
          error_message: errorMessage,
        })
        .eq("id", importRow.id);
    }
  }

  const finalStatus = failedRows > 0 ? "failed" : "completed";

  await supabase
    .from("import_batches")
    .update({
      status: finalStatus,
      success_rows: importedRows,
      failed_rows: failedRows,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  revalidatePath("/panel/imports");
  revalidatePath("/panel/transactions");
  revalidatePath("/panel/reminders");
  revalidatePath("/panel/dashboard");
  revalidatePath("/panel/reports");

  if (failedRows > 0) {
    return {
      ok: false,
      error: `${failedRows} satır içe aktarılırken hata oluştu.`,
    };
  }

  return {
    ok: true,
    summary: {
      importedRows,
      failedRows,
      transactionsCreated,
      paymentsCreated,
      remindersCreated,
    },
  };
}


import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  buildLegacyActivityInvalidDateReviewRow,
  extractLegacyActivitySheetRows,
  LEGACY_ACTIVITY_SHEET_NAMES,
  normalizeLegacyActivityRow,
  type LegacyActivityPreviewSheetSummary,
  type LegacyActivityPreviewSummary,
  type LegacyActivityRawRow,
  type LegacyActivitySheetName,
  type LegacyActivitySheetPayload,
} from "@/lib/legacy-activity-import";
import {
  getPanelAuthErrorMessage,
  requireActivePanelUser,
  type ActivePanelUser,
} from "@/lib/panel-auth";
import type { createClient } from "@/lib/supabase/server";

type PreviewErrorCode =
  | "missing_file"
  | "unreadable_format"
  | "missing_target_sheets"
  | "missing_header"
  | "missing_required_columns"
  | "empty_rows"
  | "auth"
  | "database"
  | "unknown";

type PreviewFailure = {
  ok: false;
  error: string;
  code: PreviewErrorCode;
};

type PreviewSuccess = {
  ok: true;
  summary: LegacyActivityPreviewSummary;
};

const legacySkipReasonMessages = {
  missing_patient: "Hasta adı boş olduğu için aktarılmadı.",
  financial: "Gider, gelir, tahsilat veya ödeme satırı olduğu için aktarılmadı.",
  invalid_date: "Tarih geçersiz olduğu için aktarılmadı.",
  missing_content: "Yapılan işlem ve not boş olduğu için aktarılmadı.",
  duplicate: "Bu sheet ve satır numarası daha önce aktarılmış.",
} as const;

function previewJson(body: PreviewFailure, status = 400) {
  return NextResponse.json(body, { status });
}

function logPreviewDebug(
  message: string,
  details: Record<string, unknown>,
  error?: unknown,
) {
  const errorDetails =
    error instanceof Error
      ? { errorMessage: error.message, errorStack: error.stack }
      : error
        ? { errorMessage: String(error), errorStack: null }
        : {};

  console.error("[legacy-activity-preview]", message, {
    ...details,
    ...errorDetails,
  });
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

function legacyDuplicateKey(sheetName: string | null, rowNumber: number | null) {
  return sheetName && rowNumber ? `${sheetName}:${rowNumber}` : null;
}

async function getExistingLegacyRowKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("patient_transactions")
    .select("legacy_sheet_name, legacy_row_number")
    .eq("source_type", "legacy_excel")
    .in("legacy_sheet_name", [...LEGACY_ACTIVITY_SHEET_NAMES]);

  if (error) {
    throw new Error(`Duplicate kontrolü okunamadı: ${error.message}`);
  }

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
      throw new Error(`Preview satırları kaydedilemedi: ${error.message}`);
    }
  }
}

async function persistPreview(
  fileName: string,
  sheets: LegacyActivitySheetPayload[],
  auth: ActivePanelUser,
): Promise<PreviewSuccess> {
  const { supabase, userId } = auth;
  const existingKeys = await getExistingLegacyRowKeys(supabase);
  const summaries = new Map(
    LEGACY_ACTIVITY_SHEET_NAMES.map((sheetName) => [
      sheetName,
      createEmptyLegacySheetSummary(sheetName),
    ]),
  );
  const examples: LegacyActivityPreviewSummary["examples"] = [];
  const invalidDateReviewRows: LegacyActivityPreviewSummary["invalidDateReviewRows"] =
    [];
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
        if (normalized.reason === "invalid_date") {
          const reviewRow = buildLegacyActivityInvalidDateReviewRow(
            sheet.sheetName,
            row,
          );
          if (reviewRow) {
            invalidDateReviewRows.push(reviewRow);
          }
        }
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
    throw new Error("2018 veya YENİ FAALİYETT sheetlerinde okunacak satır bulunamadı.");
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
    throw new Error(
      `Ön izleme kaydı oluşturulamadı: ${batchError?.message ?? "batch boş"}`,
    );
  }

  try {
    await insertImportRowsInChunks(
      supabase,
      normalizedRows.map((item) => ({
        batch_id: batch.id,
        row_number: item.row.rowNumber,
        raw_data: {
          sheetName: item.sheetName,
          rowNumber: item.row.rowNumber,
          values: item.row.values,
        },
        normalized_data:
          item.normalized.status === "valid" ? item.normalized.preview : null,
        status: item.normalized.status === "valid" ? "valid" : "invalid",
        error_message:
          item.normalized.status === "skipped"
            ? legacySkipReasonMessages[item.normalized.reason]
            : null,
      })),
    );
  } catch (error) {
    await supabase.from("import_batches").delete().eq("id", batch.id);
    throw error;
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
      invalidDateReviewRows,
    },
  };
}

function getFormatErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return `Dosya formatı okunamadı: ${error.message}`;
  }

  return "Dosya formatı okunamadı.";
}

export async function POST(request: Request) {
  let fileName = "-";
  let sheetNames: string[] = [];
  let sheets: LegacyActivitySheetPayload[] = [];
  let auth: ActivePanelUser;

  try {
    try {
      auth = await requireActivePanelUser();
    } catch (error) {
      return previewJson(
        {
          ok: false,
          code: "auth",
          error: getPanelAuthErrorMessage(error),
        },
        401,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      logPreviewDebug("Dosya form verisinde bulunamadı.", {
        fileName,
        sheetNamesRead: false,
        targetSheetsFound: { "2018": false, "YENİ FAALİYETT": false },
        headerRows: {},
        failedAtRow: null,
        failedAtColumn: null,
      });
      return previewJson({
        ok: false,
        code: "missing_file",
        error: "Dosya seçilemedi.",
      });
    }

    fileName = file.name;
    let workbook: XLSX.WorkBook;

    try {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      sheetNames = workbook.SheetNames;
    } catch (error) {
      logPreviewDebug(
        "Excel dosyası parse edilemedi.",
        {
          fileName,
          sheetNamesRead: false,
          targetSheetsFound: { "2018": false, "YENİ FAALİYETT": false },
          headerRows: {},
          failedAtRow: null,
          failedAtColumn: null,
        },
        error,
      );
      return previewJson({
        ok: false,
        code: "unreadable_format",
        error: getFormatErrorMessage(error),
      });
    }

    const targetSheetsFound = {
      "2018": sheetNames.includes("2018"),
      "YENİ FAALİYETT": sheetNames.includes("YENİ FAALİYETT"),
    };

    sheets = LEGACY_ACTIVITY_SHEET_NAMES.map((sheetName) =>
      extractLegacyActivitySheetRows(workbook, sheetName),
    );

    const debugBySheet = Object.fromEntries(
      sheets.map((sheet) => [sheet.sheetName, sheet.debug ?? null]),
    );

    logPreviewDebug("Excel preview parse bilgisi.", {
      fileName,
      sheetNamesRead: sheetNames.length > 0,
      sheetNames,
      targetSheetsFound,
      headerRows: Object.fromEntries(
        sheets.map((sheet) => [
          sheet.sheetName,
          sheet.debug?.headerRowNumber ?? null,
        ]),
      ),
      sheetDebug: debugBySheet,
      failedAtRow: null,
      failedAtColumn: null,
    });

    if (!targetSheetsFound["2018"] && !targetSheetsFound["YENİ FAALİYETT"]) {
      return previewJson({
        ok: false,
        code: "missing_target_sheets",
        error: "2018 veya YENİ FAALİYETT sheet’i bulunamadı.",
      });
    }

    const foundSheets = sheets.filter((sheet) => sheet.debug?.sheetExists);
    const foundSheetsWithRequiredColumnIssue = foundSheets.filter((sheet) =>
      Boolean(
        sheet.debug &&
          sheet.debug.mappedHeaderCount > 0 &&
          sheet.debug.missingRequiredFields.some(
            (field) => field === "date" || field === "patientName",
          ),
      ),
    );

    if (
      foundSheets.length > 0 &&
      foundSheetsWithRequiredColumnIssue.length === foundSheets.length
    ) {
      return previewJson({
        ok: false,
        code: "missing_required_columns",
        error: "TARİH / HASTA ADI kolonları bulunamadı.",
      });
    }

    const foundSheetsWithoutHeader = foundSheets.filter(
      (sheet) => !sheet.debug?.headerRowNumber,
    );

    if (
      foundSheets.length > 0 &&
      foundSheetsWithoutHeader.length === foundSheets.length
    ) {
      return previewJson({
        ok: false,
        code: "missing_header",
        error: "Excel başlık satırı okunamadı.",
      });
    }

    if (sheets.every((sheet) => sheet.totalRows === 0)) {
      return previewJson({
        ok: false,
        code: "empty_rows",
        error: "2018 veya YENİ FAALİYETT sheetlerinde okunacak satır bulunamadı.",
      });
    }

    return NextResponse.json(await persistPreview(fileName, sheets, auth));
  } catch (error) {
    const lastDebug = sheets
      .map((sheet) => sheet.debug)
      .filter(Boolean)
      .at(-1);

    logPreviewDebug(
      "Preview oluşturulurken hata oluştu.",
      {
        fileName,
        sheetNamesRead: sheetNames.length > 0,
        sheetNames,
        targetSheetsFound: {
          "2018": sheetNames.includes("2018"),
          "YENİ FAALİYETT": sheetNames.includes("YENİ FAALİYETT"),
        },
        headerRows: Object.fromEntries(
          sheets.map((sheet) => [
            sheet.sheetName,
            sheet.debug?.headerRowNumber ?? null,
          ]),
        ),
        failedAtRow: lastDebug?.lastScannedRowNumber ?? null,
        failedAtColumn: lastDebug?.lastScannedColumnNumber ?? null,
      },
      error,
    );

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Preview oluşturulamadı.";

    return previewJson(
      {
        ok: false,
        code: "unknown",
        error: message,
      },
      500,
    );
  }
}

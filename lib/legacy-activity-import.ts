import * as XLSX from "xlsx";

export const LEGACY_ACTIVITY_SHEET_NAMES = ["2018", "YENİ FAALİYETT"] as const;

export type LegacyActivitySheetName = (typeof LEGACY_ACTIVITY_SHEET_NAMES)[number];

export type LegacyActivityRawRow = {
  rowNumber: number;
  values: {
    date: unknown;
    sender: unknown;
    patientName: unknown;
    operation: unknown;
    note: unknown;
  };
};

export type LegacyActivitySheetPayload = {
  sheetName: LegacyActivitySheetName;
  totalRows: number;
  rows: LegacyActivityRawRow[];
  debug?: LegacyActivitySheetDebug;
};

export type LegacyActivitySheetDebug = {
  sheetExists: boolean;
  sheetRef: string | null;
  headerRowNumber: number | null;
  mappedHeaderCount: number;
  mappedFields: string[];
  missingRequiredFields: string[];
  lastScannedRowNumber: number | null;
  lastScannedColumnNumber: number | null;
};

export type LegacyActivityPreviewRow = {
  sheetName: LegacyActivitySheetName;
  rowNumber: number;
  transactionDate: string;
  sender: string | null;
  patientName: string;
  operationDescription: string;
  notes: string | null;
};

export type LegacyActivityInvalidDateReviewRow = {
  sheetName: LegacyActivitySheetName;
  rowNumber: number;
  rawDate: string;
  sender: string | null;
  patientName: string;
  operationDescription: string;
  notes: string | null;
};

export type LegacyActivitySkipReason =
  | "missing_patient"
  | "financial"
  | "invalid_date"
  | "missing_content"
  | "duplicate";

export type LegacyActivityPreviewSheetSummary = {
  sheetName: LegacyActivitySheetName;
  totalRows: number;
  importableRows: number;
  missingPatientRows: number;
  financialRows: number;
  invalidDateRows: number;
  missingContentRows: number;
  duplicateRows: number;
};

export type LegacyActivityPreviewSummary = {
  batchId: string;
  fileName: string;
  sheets: LegacyActivityPreviewSheetSummary[];
  totalRows: number;
  importableRows: number;
  missingPatientRows: number;
  financialRows: number;
  invalidDateRows: number;
  missingContentRows: number;
  duplicateRows: number;
  examples: LegacyActivityPreviewRow[];
  invalidDateReviewRows: LegacyActivityInvalidDateReviewRow[];
};

export type LegacyActivityImportSummary = {
  importedRows: number;
  totalPreviewImportableRows: number;
  totalSubmittedRows: number;
  newlyInsertedRows: number;
  normalImportedRows: number;
  correctedDateImportedRows: number;
  uncorrectedInvalidDateRows: number;
  duplicateRows: number;
  failedRows: number;
};

type HeaderField = keyof LegacyActivityRawRow["values"];

const HEADER_ALIASES: Record<string, HeaderField> = {
  tarih: "date",
  gonderen: "sender",
  adisoyadi: "patientName",
  hastaadi: "patientName",
  yapilanislem: "operation",
  islem: "operation",
  not: "note",
  aciklama: "note",
};

const FINANCIAL_KEYWORDS = [
  "gider",
  "gelir",
  "tahsilat",
  "tahsil",
  "odeme",
  "banka",
  "kredi karti",
  "havale",
  "eft",
  "kasa",
  "pos",
  "satis iptali",
  "iptal",
];

const PATIENT_INFO_OPERATIONS = new Set([
  "hasta bilgisi",
  "hasta bilgileri",
]);

const MIN_VALID_YEAR = 1980;
const MAX_VALID_YEAR = 2100;
const MAX_SCAN_COLUMNS = 80;
const HEADER_SEARCH_ROWS = 20;
const MAX_DATA_ROWS = 20000;
const EMPTY_ROW_BREAK = 200;

function stripTurkishChars(value: string) {
  return value.replace(/[çğıöşü]/g, (char) => {
    const map: Record<string, string> = {
      ç: "c",
      ğ: "g",
      ı: "i",
      ö: "o",
      ş: "s",
      ü: "u",
    };

    return map[char] ?? char;
  });
}

export function normalizeLegacyActivityText(value: string): string {
  return stripTurkishChars(value.toLocaleLowerCase("tr-TR"))
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHeader(value: string) {
  return normalizeLegacyActivityText(value).replace(/ /g, "");
}

function toText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  return String(value).trim();
}

function toSerializableCellValue(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toText(value);
  }

  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value ?? "";
  }

  return String(value).trim();
}

function isCellEmpty(value: unknown) {
  return toText(value) === "";
}

function isPlausibleDate(year: number, month: number, day: number) {
  if (
    year < MIN_VALID_YEAR ||
    year > MAX_VALID_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function toISODate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function excelSerialToISO(serial: number): string | null {
  if (serial <= 59 || serial >= 2958466) {
    return null;
  }

  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return isPlausibleDate(year, month, day) ? toISODate(year, month, day) : null;
}

export function parseLegacyActivityDate(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = value.getMonth() + 1;
    const day = value.getDate();
    return isPlausibleDate(year, month, day) ? toISODate(year, month, day) : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToISO(value);
  }

  const raw = toText(value);
  if (!raw) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isPlausibleDate(year, month, day) ? toISODate(year, month, day) : null;
  }

  const trMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (trMatch) {
    const day = Number(trMatch[1]);
    const month = Number(trMatch[2]);
    const year = Number(trMatch[3]);
    return isPlausibleDate(year, month, day) ? toISODate(year, month, day) : null;
  }

  if (/^\d+$/.test(raw) && raw.length >= 5) {
    return excelSerialToISO(Number(raw));
  }

  return null;
}

export function isLegacyActivitySheetName(
  value: string,
): value is LegacyActivitySheetName {
  return LEGACY_ACTIVITY_SHEET_NAMES.some((sheetName) => sheetName === value);
}

function mapHeader(value: unknown): HeaderField | null {
  const text = toText(value);
  if (!text) {
    return null;
  }

  return HEADER_ALIASES[normalizeHeader(text)] ?? null;
}

function isRepeatedHeader(values: LegacyActivityRawRow["values"]) {
  return Object.values(values).filter((value) => mapHeader(value) != null).length >= 2;
}

function hasFinancialSignal(value: string) {
  const padded = ` ${value} `;
  return FINANCIAL_KEYWORDS.some((keyword) => padded.includes(` ${keyword} `));
}

function isFinancialLegacyActivity(
  sender: string | null,
  operationRaw: string,
  note: string | null,
) {
  const normalizedOperation = normalizeLegacyActivityText(operationRaw);
  const isPatientInfoOperation =
    PATIENT_INFO_OPERATIONS.has(normalizedOperation);
  const searchable = normalizeLegacyActivityText(
    [sender ?? "", operationRaw, note ?? ""].join(" "),
  );

  return !isPatientInfoOperation && hasFinancialSignal(searchable);
}

export function extractLegacyActivitySheetRows(
  workbook: XLSX.WorkBook,
  sheetName: LegacyActivitySheetName,
): LegacyActivitySheetPayload {
  const sheet = workbook.Sheets[sheetName];
  const ref = sheet?.["!ref"];
  const emptyDebug: LegacyActivitySheetDebug = {
    sheetExists: Boolean(sheet),
    sheetRef: ref ?? null,
    headerRowNumber: null,
    mappedHeaderCount: 0,
    mappedFields: [],
    missingRequiredFields: ["date", "patientName"],
    lastScannedRowNumber: null,
    lastScannedColumnNumber: null,
  };

  if (!sheet || !ref) {
    return { sheetName, totalRows: 0, rows: [], debug: emptyDebug };
  }

  const range = XLSX.utils.decode_range(ref);
  const colStart = range.s.c;
  const colEnd = Math.min(range.e.c, colStart + MAX_SCAN_COLUMNS - 1);
  const readCell = (r: number, c: number): unknown =>
    sheet[XLSX.utils.encode_cell({ r, c })]?.v;

  let headerRow = -1;
  let bestMapped = 0;
  const headerSearchEnd = Math.min(range.e.r, range.s.r + HEADER_SEARCH_ROWS - 1);
  let lastScannedRowNumber: number | null = null;
  let lastScannedColumnNumber: number | null = null;

  for (let r = range.s.r; r <= headerSearchEnd; r += 1) {
    let mapped = 0;
    lastScannedRowNumber = r + 1;

    for (let c = colStart; c <= colEnd; c += 1) {
      lastScannedColumnNumber = c + 1;
      if (mapHeader(readCell(r, c))) {
        mapped += 1;
      }
    }

    if (mapped > bestMapped) {
      bestMapped = mapped;
      headerRow = r;
    }
  }

  const columns: Array<{ columnIndex: number; field: HeaderField }> = [];
  const usedFields = new Set<HeaderField>();

  if (headerRow !== -1) {
    for (let c = colStart; c <= colEnd; c += 1) {
      lastScannedColumnNumber = c + 1;
      const field = mapHeader(readCell(headerRow, c));
      if (field && !usedFields.has(field)) {
        columns.push({ columnIndex: c, field });
        usedFields.add(field);
      }
    }
  }

  const missingRequiredFields = (["date", "patientName"] as HeaderField[]).filter(
    (field) => !usedFields.has(field),
  );
  const debug: LegacyActivitySheetDebug = {
    sheetExists: true,
    sheetRef: ref,
    headerRowNumber: headerRow === -1 || bestMapped < 3 ? null : headerRow + 1,
    mappedHeaderCount: bestMapped,
    mappedFields: [...usedFields],
    missingRequiredFields,
    lastScannedRowNumber,
    lastScannedColumnNumber,
  };

  if (headerRow === -1 || bestMapped < 3) {
    return { sheetName, totalRows: 0, rows: [], debug };
  }

  const rows: LegacyActivityRawRow[] = [];
  const dataRowEnd = Math.min(range.e.r, headerRow + MAX_DATA_ROWS);
  let totalRows = 0;
  let consecutiveEmpty = 0;

  for (let r = headerRow + 1; r <= dataRowEnd; r += 1) {
    lastScannedRowNumber = r + 1;
    const values: LegacyActivityRawRow["values"] = {
      date: "",
      sender: "",
      patientName: "",
      operation: "",
      note: "",
    };
    let hasValue = false;

    for (const column of columns) {
      lastScannedColumnNumber = column.columnIndex + 1;
      const value = readCell(r, column.columnIndex);
      values[column.field] = toSerializableCellValue(value);
      if (!isCellEmpty(value)) {
        hasValue = true;
      }
    }

    totalRows += 1;

    if (!hasValue) {
      consecutiveEmpty += 1;
      if (consecutiveEmpty >= EMPTY_ROW_BREAK) {
        totalRows -= consecutiveEmpty;
        break;
      }
      continue;
    }

    consecutiveEmpty = 0;

    if (isRepeatedHeader(values)) {
      continue;
    }

    rows.push({ rowNumber: r + 1, values });
  }

  return {
    sheetName,
    totalRows,
    rows,
    debug: {
      ...debug,
      lastScannedRowNumber,
      lastScannedColumnNumber,
    },
  };
}

export function normalizeLegacyActivityRow(
  sheetName: LegacyActivitySheetName,
  row: LegacyActivityRawRow,
  duplicateKeys: Set<string> = new Set(),
):
  | { status: "valid"; preview: LegacyActivityPreviewRow }
  | { status: "skipped"; reason: LegacyActivitySkipReason } {
  const patientName = toText(row.values.patientName);
  if (!patientName) {
    return { status: "skipped", reason: "missing_patient" };
  }

  const transactionDate = parseLegacyActivityDate(row.values.date);
  if (!transactionDate) {
    return { status: "skipped", reason: "invalid_date" };
  }

  const sender = toText(row.values.sender) || null;
  const note = toText(row.values.note) || null;
  const operationRaw = toText(row.values.operation);

  if (!operationRaw && !note) {
    return { status: "skipped", reason: "missing_content" };
  }

  if (isFinancialLegacyActivity(sender, operationRaw, note)) {
    return { status: "skipped", reason: "financial" };
  }

  const duplicateKey = `${sheetName}:${row.rowNumber}`;
  if (duplicateKeys.has(duplicateKey)) {
    return { status: "skipped", reason: "duplicate" };
  }

  return {
    status: "valid",
    preview: {
      sheetName,
      rowNumber: row.rowNumber,
      transactionDate,
      sender,
      patientName,
      operationDescription: operationRaw || "Eski faaliyet kaydı",
      notes: note,
    },
  };
}

export function buildLegacyActivityInvalidDateReviewRow(
  sheetName: LegacyActivitySheetName,
  row: LegacyActivityRawRow,
): LegacyActivityInvalidDateReviewRow | null {
  const patientName = toText(row.values.patientName);
  if (!patientName) {
    return null;
  }

  if (parseLegacyActivityDate(row.values.date)) {
    return null;
  }

  const sender = toText(row.values.sender) || null;
  const note = toText(row.values.note) || null;
  const operationRaw = toText(row.values.operation);

  return {
    sheetName,
    rowNumber: row.rowNumber,
    rawDate: toText(row.values.date) || "-",
    sender,
    patientName,
    operationDescription: operationRaw || "Eski faaliyet kaydı",
    notes: note,
  };
}

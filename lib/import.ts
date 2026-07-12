export const EXCEL_COLUMNS = [
  "Tarih",
  "Şube / Birim",
  "Hastane",
  "Raporu Çıkaran Hekim",
  "Referans",
  "Hasta Adı Soyadı",
  "Telefon",
  "Yapılan İşlem",
  "Marka",
  "Model",
  "Seri No",
  "Kulak",
  "Satış Tutarı",
  "Nakit",
  "Kredi Kartı",
  "Havale",
  "Açıklama",
  "İlgilenen Personel",
  "Hatırlatma Tarihi",
  "Hatırlatma Açıklaması",
] as const;

export type ExcelColumn = (typeof EXCEL_COLUMNS)[number];

export type ImportBatchStatus = "preview" | "importing" | "completed" | "failed";
export type ImportRowStatus = "valid" | "invalid" | "imported" | "failed";

export type NormalizedImportRow = {
  branch: string | null;
  transaction_date: string;
  hospital: string | null;
  doctor_name: string | null;
  reference_source: string | null;
  patient_name: string;
  patient_phone: string;
  operation_description: string;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  ear_side: string | null;
  sale_amount: number;
  cash: number;
  credit_card: number;
  bank_transfer: number;
  notes: string | null;
  staff_name: string | null;
  reminder_date: string | null;
  reminder_description: string | null;
};

export type ImportPreviewRow = {
  rowNumber: number;
  status: "valid" | "invalid";
  patientName: string;
  phone: string;
  date: string;
  operation: string;
  saleAmount: number;
  cash: number;
  creditCard: number;
  bankTransfer: number;
  remainingDebt: number;
  errorMessage: string | null;
};

export type ImportValidationResult = {
  status: "valid" | "invalid";
  errors: string[];
  normalized: NormalizedImportRow | null;
  preview: ImportPreviewRow;
  rawData: Record<string, unknown>;
};

const EXCEL_IMPORT_STAFF = "Excel Import";

export function getExcelImportStaffName() {
  return EXCEL_IMPORT_STAFF;
}

const COLUMN_ALIASES: Partial<Record<ExcelColumn, string[]>> = {
  "Şube / Birim": ["Şube", "Şube Adı", "Birim"],
  "Raporu Çıkaran Hekim": ["Hekim", "Doktor", "Doktor Adı"],
  "Hasta Adı Soyadı": ["Hasta Adı", "Adı Soyadı", "Hasta"],
  "Yapılan İşlem": ["İşlem", "Prosedür"],
  "Satış Tutarı": ["Satış", "Tutar"],
  "Kredi Kartı": ["Kart", "Kredi", "Kredi / Kredi Kartı"],
  "İlgilenen Personel": ["Personel", "İlgilenen"],
  "Hatırlatma Açıklaması": ["Hatırlatma Notu", "Hatırlatma Açıklama"],
};

function readCell(row: Record<string, unknown>, column: ExcelColumn): unknown {
  if (column in row) {
    return row[column];
  }

  const acceptedNames = [column, ...(COLUMN_ALIASES[column] ?? [])].map((name) =>
    name.trim().toLocaleLowerCase("tr-TR"),
  );

  const normalizedKey = Object.keys(row).find((key) =>
    acceptedNames.includes(key.trim().toLocaleLowerCase("tr-TR")),
  );

  return normalizedKey ? row[normalizedKey] : "";
}

function readTextValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

function cleanImportRow(row: Record<string, unknown>): Record<string, unknown> {
  const cleanRow: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(row)) {
    const key = rawKey.trim();

    if (!key || key.startsWith("__EMPTY")) {
      continue;
    }

    cleanRow[key] = value;
  }

  return cleanRow;
}

function isRowEmpty(row: Record<string, unknown>) {
  return EXCEL_COLUMNS.every((column) => readTextValue(readCell(row, column)) === "");
}

export function parseMoneyValue(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value)
    .trim()
    .replace(/[₺\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseExcelSerialDate(serial: number): string | null {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function parseExcelDate(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return parseExcelSerialDate(value);
  }

  const text = readTextValue(value);
  if (!text) {
    return null;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const trMatch = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (trMatch) {
    const day = trMatch[1].padStart(2, "0");
    const month = trMatch[2].padStart(2, "0");
    return `${trMatch[3]}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

export function normalizeEarSide(value: unknown): string | null {
  const text = readTextValue(value).toLocaleLowerCase("tr-TR");
  if (!text) {
    return null;
  }

  const mapping: Record<string, string> = {
    sağ: "right",
    sag: "right",
    right: "right",
    sol: "left",
    left: "left",
    çift: "both",
    cift: "both",
    both: "both",
  };

  return mapping[text] ?? null;
}

function optionalMoney(value: unknown, errors: string[], label: string) {
  const hasValue = readTextValue(value) !== "";
  const parsed = parseMoneyValue(value);

  if (!hasValue) {
    return 0;
  }

  if (parsed == null || parsed <= 0) {
    errors.push(`${label} pozitif sayı olmalıdır.`);
    return 0;
  }

  return parsed;
}

export function validateImportRow(
  row: Record<string, unknown>,
  rowNumber: number,
): ImportValidationResult {
  const errors: string[] = [];

  const patientName = readTextValue(readCell(row, "Hasta Adı Soyadı"));
  const phone = readTextValue(readCell(row, "Telefon"));
  const transactionDate = parseExcelDate(readCell(row, "Tarih"));
  const operationDescription = readTextValue(readCell(row, "Yapılan İşlem"));
  const saleAmountRaw = parseMoneyValue(readCell(row, "Satış Tutarı"));
  const cash = optionalMoney(readCell(row, "Nakit"), errors, "Nakit");
  const creditCard = optionalMoney(
    readCell(row, "Kredi Kartı"),
    errors,
    "Kredi Kartı",
  );
  const bankTransfer = optionalMoney(readCell(row, "Havale"), errors, "Havale");
  const earSideRaw = readTextValue(readCell(row, "Kulak"));
  const reminderDateRaw = readCell(row, "Hatırlatma Tarihi");
  const reminderDate = reminderDateRaw
    ? parseExcelDate(reminderDateRaw)
    : null;
  const staffName = readTextValue(readCell(row, "İlgilenen Personel"));
  const reminderDescription = readTextValue(readCell(row, "Hatırlatma Açıklaması"));

  if (!patientName) {
    errors.push("Hasta Adı Soyadı zorunludur.");
  }

  if (!phone) {
    errors.push("Telefon zorunludur.");
  }

  if (!transactionDate) {
    errors.push("Tarih geçerli bir tarih olmalıdır.");
  }

  if (!operationDescription) {
    errors.push("Yapılan İşlem zorunludur.");
  }

  if (saleAmountRaw == null || saleAmountRaw <= 0) {
    errors.push("Satış Tutarı pozitif sayı olmalıdır.");
  }

  const saleAmount = saleAmountRaw ?? 0;
  const totalPayments = cash + creditCard + bankTransfer;

  if (totalPayments > saleAmount) {
    errors.push("Ödeme toplamı satış tutarından büyük olamaz.");
  }

  let earSide: string | null = null;
  if (earSideRaw) {
    earSide = normalizeEarSide(earSideRaw);
    if (!earSide) {
      errors.push(
        "Kulak değeri geçersiz. Kabul edilen: sağ, sol, çift, right, left, both.",
      );
    }
  }

  if (readTextValue(reminderDateRaw) && !reminderDate) {
    errors.push("Hatırlatma Tarihi geçerli bir tarih olmalıdır.");
  }

  const normalized: NormalizedImportRow | null =
    errors.length === 0 && transactionDate
      ? {
          branch: readTextValue(readCell(row, "Şube / Birim")) || null,
          transaction_date: transactionDate,
          hospital: readTextValue(readCell(row, "Hastane")) || null,
          doctor_name: readTextValue(readCell(row, "Raporu Çıkaran Hekim")) || null,
          reference_source: readTextValue(readCell(row, "Referans")) || null,
          patient_name: patientName,
          patient_phone: phone,
          operation_description: operationDescription,
          brand: readTextValue(readCell(row, "Marka")) || null,
          model: readTextValue(readCell(row, "Model")) || null,
          serial_no: readTextValue(readCell(row, "Seri No")) || null,
          ear_side: earSide,
          sale_amount: saleAmount,
          cash,
          credit_card: creditCard,
          bank_transfer: bankTransfer,
          notes: readTextValue(readCell(row, "Açıklama")) || null,
          staff_name: staffName || null,
          reminder_date: reminderDate,
          reminder_description: reminderDescription || null,
        }
      : null;

  const remainingDebt = saleAmount - totalPayments;

  return {
    status: errors.length === 0 ? "valid" : "invalid",
    errors,
    normalized,
    rawData: row,
    preview: {
      rowNumber,
      status: errors.length === 0 ? "valid" : "invalid",
      patientName: patientName || "-",
      phone: phone || "-",
      date: transactionDate ? transactionDate : "-",
      operation: operationDescription || "-",
      saleAmount,
      cash,
      creditCard,
      bankTransfer,
      remainingDebt,
      errorMessage: errors.length > 0 ? errors.join(" ") : null,
    },
  };
}

export function validateImportRows(rows: Record<string, unknown>[]) {
  const results: ImportValidationResult[] = [];
  let rowNumber = 1;

  for (const row of rows) {
    const cleanRow = cleanImportRow(row);

    if (isRowEmpty(cleanRow)) {
      continue;
    }

    results.push(validateImportRow(cleanRow, rowNumber));
    rowNumber += 1;
  }

  const validRows = results.filter((result) => result.status === "valid").length;
  const failedRows = results.filter((result) => result.status === "invalid").length;

  return {
    results,
    totalRows: results.length,
    validRows,
    failedRows,
  };
}

export type ImportResultSummary = {
  importedRows: number;
  failedRows: number;
  transactionsCreated: number;
  paymentsCreated: number;
  remindersCreated: number;
};

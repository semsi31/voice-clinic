import * as XLSX from "xlsx";

/**
 * Eski (standart şablona uymayan) Excel dosyaları için salt-analiz modülü.
 * Bu modül hiçbir şekilde veritabanına yazmaz; yalnızca okuma/sınıflandırma yapar.
 * Standart import akışı (lib/import.ts) bu dosyadan bağımsızdır.
 */

export type LegacyRowCategory =
  | "patient_transaction"
  | "collection"
  | "expense"
  | "cargo"
  | "stock"
  | "info"
  | "review";

export type LegacyConfidenceLabel = "yüksek" | "orta" | "düşük";

export type LegacyFieldKey =
  | "branch"
  | "date"
  | "sender"
  | "patientName"
  | "incoming"
  | "outgoing"
  | "note"
  | "saleAmount"
  | "income"
  | "expense"
  | "bank"
  | "creditCard"
  | "remainingDebt"
  | "documentNo"
  | "commission"
  | "atikse"
  | "procedure"
  | "phone"
  | "cargoCompany"
  | "cargoBranch"
  | "trackingNo"
  | "brand"
  | "model"
  | "serialNo"
  | "earSide"
  | "staff";

export type LegacyDateStatus = "valid" | "invalid" | "empty";

export type LegacyMoneyResult = {
  value: number | null;
  raw: string;
  parseFailed: boolean;
};

export type LegacyNormalizedRow = {
  branch: string | null;
  dateISO: string | null;
  dateRaw: string;
  dateStatus: LegacyDateStatus;
  sender: string | null;
  patientName: string | null;
  procedure: string | null;
  note: string | null;
  phone: string | null;
  phoneSource: "column" | "note" | null;
  saleAmount: number | null;
  income: number | null;
  expense: number | null;
  bank: number | null;
  creditCard: number | null;
  remainingDebt: number | null;
  commission: number | null;
  estimatedPaid: number | null;
  incoming: string | null;
  outgoing: string | null;
  cargoCompany: string | null;
  cargoBranch: string | null;
  trackingNo: string | null;
  documentNo: string | null;
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  earSide: string | null;
  staff: string | null;
};

export type LegacyImportRowAnalysis = {
  rowNumber: number;
  rawData: Record<string, unknown>;
  normalized: LegacyNormalizedRow;
  category: LegacyRowCategory;
  warnings: string[];
  errors: string[];
  confidenceLabel: LegacyConfidenceLabel;
};

export type LegacyImportSummary = {
  sheetName: string;
  totalRowsScanned: number;
  meaningfulRows: number;
  patientTransactionCount: number;
  collectionCount: number;
  expenseCount: number;
  cargoCount: number;
  stockCount: number;
  infoCount: number;
  reviewCount: number;
  phoneMissingCount: number;
  invalidDateCount: number;
  saleAmountTotal: number;
  incomeTotal: number;
  expenseTotal: number;
  bankCardTotal: number;
  remainingDebtTotal: number;
};

export type LegacyColumnInfo = {
  columnIndex: number;
  header: string;
  field: LegacyFieldKey | null;
};

export type LegacyImportAnalysis = {
  sheetName: string;
  headerRowNumber: number;
  columns: LegacyColumnInfo[];
  unmappedHeaders: string[];
  mappedHeaders: LegacyColumnInfo[];
  topProcedures: Array<{ value: string; count: number }>;
  rows: LegacyImportRowAnalysis[];
  summary: LegacyImportSummary;
};

export const LEGACY_CATEGORY_LABELS: Record<LegacyRowCategory, string> = {
  patient_transaction: "Hasta işlem adayı",
  collection: "Tahsilat adayı",
  expense: "Gider adayı",
  cargo: "Kargo adayı",
  stock: "Stok hareketi adayı",
  info: "Bilgi / not satırı",
  review: "Hatalı / incelenmeli",
};

// ---------------------------------------------------------------------------
// Metin normalizasyonu
// ---------------------------------------------------------------------------

const TR_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

export function normalizeLegacyText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => TR_CHAR_MAP[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHeaderKey(value: string): string {
  return normalizeLegacyText(value).replace(/ /g, "");
}

// ---------------------------------------------------------------------------
// Kolon başlığı -> alan eşleme
// ---------------------------------------------------------------------------

const EXACT_HEADER_MAP: Record<string, LegacyFieldKey> = {
  sube: "branch",
  subeadi: "branch",
  protimisitmemrkzhstsb: "branch",
  protimisitmemerkezihastanesubesi: "branch",
  protimisitmemrkhstsb: "branch",
  hastane: "branch",
  hst: "branch",
  hstsb: "branch",
  tarih: "date",
  gonderen: "sender",
  hastaadi: "patientName",
  adisoyadi: "patientName",
  adsoyad: "patientName",
  hastaadisoyadi: "patientName",
  hastaadsoyad: "patientName",
  hasta: "patientName",
  giren: "incoming",
  cikan: "outgoing",
  not: "note",
  notlar: "note",
  aciklama: "note",
  satistutari: "saleAmount",
  satistutar: "saleAmount",
  satis: "saleAmount",
  tutar: "saleAmount",
  gelir: "income",
  gider: "expense",
  banka: "bank",
  kredi: "creditCard",
  kredikarti: "creditCard",
  kredikredikarti: "creditCard",
  kkarti: "creditCard",
  kk: "creditCard",
  kalanborc: "remainingDebt",
  kalanbakiye: "remainingDebt",
  kalan: "remainingDebt",
  dokumanno: "documentNo",
  belgeno: "documentNo",
  kkkomisyonu: "commission",
  kkkomisyon: "commission",
  komisyon: "commission",
  atikse: "atikse",
  prosedur: "procedure",
  islem: "procedure",
  yapilanislem: "procedure",
  gelenkargo: "procedure",
  gidenkargo: "procedure",
  telefon: "phone",
  tel: "phone",
  gsm: "phone",
  cep: "phone",
  ceptelefonu: "phone",
  firmaadi: "cargoCompany",
  kargofirmasi: "cargoCompany",
  kargofirma: "cargoCompany",
  kargo: "cargoCompany",
  kargosubesi: "cargoBranch",
  subesi: "cargoBranch",
  firma: "cargoCompany",
  takipno: "trackingNo",
  takipnumarasi: "trackingNo",
  kargotakipno: "trackingNo",
  kargotakip: "trackingNo",
  marka: "brand",
  model: "model",
  serino: "serialNo",
  kulak: "earSide",
  ilgilenenpersonel: "staff",
  ilgilenen: "staff",
  personel: "staff",
};

const CONTAINS_HEADER_RULES: Array<[string, LegacyFieldKey]> = [
  ["hastaad", "patientName"],
  ["adisoyad", "patientName"],
  ["adsoyad", "patientName"],
  ["telefon", "phone"],
  ["satistutar", "saleAmount"],
  ["satis", "saleAmount"],
  ["kalanbor", "remainingDebt"],
  ["kalanbaki", "remainingDebt"],
  ["kredi", "creditCard"],
  ["komisyon", "commission"],
  ["takip", "trackingNo"],
  ["firmaadi", "cargoCompany"],
  ["kargofirm", "cargoCompany"],
  ["kargosube", "cargoBranch"],
  ["prosedur", "procedure"],
  ["islem", "procedure"],
  ["dokuman", "documentNo"],
  ["belgeno", "documentNo"],
  ["tarih", "date"],
  ["gonderen", "sender"],
  ["protimisitme", "branch"],
  ["hastane", "branch"],
  ["hst", "branch"],
  ["sube", "branch"],
  ["marka", "brand"],
  ["model", "model"],
  ["serino", "serialNo"],
  ["kulak", "earSide"],
  ["ilgilenen", "staff"],
  ["personel", "staff"],
];

export function mapLegacyHeader(header: string): LegacyFieldKey | null {
  const key = normalizeHeaderKey(header);
  if (!key) {
    return null;
  }

  const exact = EXACT_HEADER_MAP[key];
  if (exact) {
    return exact;
  }

  for (const [needle, field] of CONTAINS_HEADER_RULES) {
    if (key.includes(needle)) {
      return field;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tarih analizi
// ---------------------------------------------------------------------------

const MIN_VALID_YEAR = 1980;
const MAX_VALID_YEAR = 2100;

function isPlausibleDateParts(year: number, month: number, day: number) {
  return (
    year >= MIN_VALID_YEAR &&
    year <= MAX_VALID_YEAR &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

function toISO(year: number, month: number, day: number) {
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
  if (year < MIN_VALID_YEAR || year > MAX_VALID_YEAR) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function parseLegacyDate(value: unknown): {
  status: LegacyDateStatus;
  iso: string | null;
  raw: string;
} {
  if (value == null || value === "") {
    return { status: "empty", iso: null, raw: "" };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { status: "invalid", iso: null, raw: String(value) };
    }
    const year = value.getFullYear();
    if (year < MIN_VALID_YEAR || year > MAX_VALID_YEAR) {
      return {
        status: "invalid",
        iso: null,
        raw: value.toISOString().slice(0, 10),
      };
    }
    // Yerel saat kaymasını önlemek için parçalardan ISO üret.
    return {
      status: "valid",
      iso: toISO(year, value.getMonth() + 1, value.getDate()),
      raw: toISO(year, value.getMonth() + 1, value.getDate()),
    };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const iso = excelSerialToISO(value);
    return iso
      ? { status: "valid", iso, raw: String(value) }
      : { status: "invalid", iso: null, raw: String(value) };
  }

  const raw = String(value).trim();
  if (!raw) {
    return { status: "empty", iso: null, raw: "" };
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isPlausibleDateParts(year, month, day)
      ? { status: "valid", iso: toISO(year, month, day), raw }
      : { status: "invalid", iso: null, raw };
  }

  const trMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{1,4})$/);
  if (trMatch) {
    const day = Number(trMatch[1]);
    const month = Number(trMatch[2]);
    const yearText = trMatch[3];
    const year = Number(yearText);

    // 21.12.1018, 02.01.201, 25.01.019 gibi bozuk yıllar burada yakalanır.
    if (yearText.length !== 4 || !isPlausibleDateParts(year, month, day)) {
      return { status: "invalid", iso: null, raw };
    }

    return { status: "valid", iso: toISO(year, month, day), raw };
  }

  if (/^\d+$/.test(raw)) {
    // Metin olarak saklanmış Excel seri numarası olabilir; kısa değerler
    // ("11" gibi) belirsiz kabul edilir.
    if (raw.length >= 5) {
      const iso = excelSerialToISO(Number(raw));
      if (iso) {
        return { status: "valid", iso, raw };
      }
    }
    return { status: "invalid", iso: null, raw };
  }

  return { status: "invalid", iso: null, raw };
}

// ---------------------------------------------------------------------------
// Tutar analizi
// ---------------------------------------------------------------------------

export function parseLegacyMoney(value: unknown): LegacyMoneyResult {
  if (value == null || value === "") {
    return { value: null, raw: "", parseFailed: false };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { value, raw: String(value), parseFailed: false };
  }

  const raw = String(value).trim();
  if (!raw) {
    return { value: null, raw: "", parseFailed: false };
  }

  const tokenMatch = raw.replace(/\s/g, "").match(/-?\d[\d.,]*/);
  if (!tokenMatch) {
    return { value: null, raw, parseFailed: true };
  }

  let token = tokenMatch[0];
  if (token.includes(",")) {
    // 45.000,00 -> 45000.00
    token = token.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(token)) {
    // 45.000 -> 45000 (binlik ayraç)
    token = token.replace(/\./g, "");
  }

  const parsed = Number(token);
  if (!Number.isFinite(parsed)) {
    return { value: null, raw, parseFailed: true };
  }

  return { value: parsed, raw, parseFailed: false };
}

// ---------------------------------------------------------------------------
// Telefon analizi
// ---------------------------------------------------------------------------

const PHONE_REGEX =
  /(?:\+?90[\s\-.]?)?0?\s*\(?(5\d{2}|[2348]\d{2})\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g;

export function findLegacyPhone(text: string): string | null {
  if (!text) {
    return null;
  }

  PHONE_REGEX.lastIndex = 0;
  const matches = text.match(PHONE_REGEX);
  if (!matches) {
    return null;
  }

  for (const candidate of matches) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 12) {
      return candidate.trim();
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Kategori anahtar kelimeleri (normalize edilmiş halleriyle)
// ---------------------------------------------------------------------------

const TRANSACTION_KEYWORDS = [
  "cihaz satis",
  "satis",
  "pil satis",
  "pil",
  "yedek parca",
  "tamir",
  "cihaz tamir",
  "kalip teslim",
  "kalip alis",
  "cihaz gorus",
  "hasta bilgisi",
];

const COLLECTION_KEYWORDS = ["tahsilat"];
const EXPENSE_KEYWORDS = ["gider"];
const CARGO_KEYWORDS = ["gelen kargo", "giden kargo", "kargo"];

// ---------------------------------------------------------------------------
// Satır analizi
// ---------------------------------------------------------------------------

function toDisplayText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toISO(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  return String(value).trim();
}

type FieldValues = Partial<Record<LegacyFieldKey, unknown>>;

function analyzeLegacyRow(
  fieldValues: FieldValues,
  rawData: Record<string, unknown>,
  rowNumber: number,
  isCargoSheet: boolean,
): LegacyImportRowAnalysis {
  const warnings: string[] = [];
  const errors: string[] = [];

  const branch = toDisplayText(fieldValues.branch) || null;
  const sender = toDisplayText(fieldValues.sender) || null;
  const patientName = toDisplayText(fieldValues.patientName) || null;
  const procedure = toDisplayText(fieldValues.procedure) || null;
  const note = toDisplayText(fieldValues.note) || null;
  const incoming = toDisplayText(fieldValues.incoming) || null;
  const outgoing = toDisplayText(fieldValues.outgoing) || null;
  const cargoCompany = toDisplayText(fieldValues.cargoCompany) || null;
  const cargoBranch = toDisplayText(fieldValues.cargoBranch) || null;
  const trackingNo = toDisplayText(fieldValues.trackingNo) || null;
  const documentNo = toDisplayText(fieldValues.documentNo) || null;
  const brand = toDisplayText(fieldValues.brand) || null;
  const model = toDisplayText(fieldValues.model) || null;
  const serialNo = toDisplayText(fieldValues.serialNo) || null;
  const earSide = toDisplayText(fieldValues.earSide) || null;
  const staff = toDisplayText(fieldValues.staff) || null;

  const dateResult = parseLegacyDate(fieldValues.date);
  const saleAmount = parseLegacyMoney(fieldValues.saleAmount);
  const income = parseLegacyMoney(fieldValues.income);
  const expense = parseLegacyMoney(fieldValues.expense);
  const bank = parseLegacyMoney(fieldValues.bank);
  const creditCard = parseLegacyMoney(fieldValues.creditCard);
  const remainingDebt = parseLegacyMoney(fieldValues.remainingDebt);
  const commission = parseLegacyMoney(fieldValues.commission);

  // Telefon: önce kolon, yoksa NOT / prosedür içinde regex ile ara.
  let phone: string | null = null;
  let phoneSource: "column" | "note" | null = null;
  const phoneColumn = toDisplayText(fieldValues.phone);
  if (phoneColumn) {
    phone = phoneColumn;
    phoneSource = "column";
  } else {
    const foundPhone = findLegacyPhone([note ?? "", procedure ?? ""].join(" "));
    if (foundPhone) {
      phone = foundPhone;
      phoneSource = "note";
    }
  }

  const searchableText = normalizeLegacyText(
    [
      procedure ?? "",
      note ?? "",
      incoming ?? "",
      outgoing ?? "",
      cargoCompany ?? "",
      cargoBranch ?? "",
      trackingNo ?? "",
      brand ?? "",
      model ?? "",
      serialNo ?? "",
    ].join(" "),
  );

  const hasSaleAmount = saleAmount.value != null && saleAmount.value > 0;
  const hasIncome = income.value != null && income.value > 0;
  const hasExpense = expense.value != null && expense.value > 0;
  const hasBank = bank.value != null && bank.value > 0;
  const hasCard = creditCard.value != null && creditCard.value > 0;
  const hasPayment = hasIncome || hasBank || hasCard;
  const hasRemainingDebt = remainingDebt.value != null && remainingDebt.value > 0;
  const hasCargoKeyword = CARGO_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );
  const hasCargoSignal = Boolean(
    isCargoSheet ||
      cargoCompany ||
      cargoBranch ||
      trackingNo ||
      hasCargoKeyword,
  );
  const hasDeviceSignal = Boolean(brand || model || serialNo || earSide);
  const hasStockSignal =
    Boolean(incoming || outgoing) && !hasCargoSignal && hasDeviceSignal;
  const hasTransactionKeyword = TRANSACTION_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );
  const hasCollectionKeyword = COLLECTION_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );
  const hasExpenseKeyword = EXPENSE_KEYWORDS.some((keyword) =>
    searchableText.includes(keyword),
  );

  // Kritik hatalar kategori önceliğinde en üsttedir.
  if (dateResult.status === "invalid") {
    errors.push(`Tarih hatalı: "${dateResult.raw}"`);
  } else if (dateResult.status === "empty") {
    warnings.push("Tarih boş");
  }

  const moneyParseFailures: string[] = [];
  if (saleAmount.parseFailed) moneyParseFailures.push("Satış Tutarı");
  if (income.parseFailed) moneyParseFailures.push("Gelir");
  if (expense.parseFailed) moneyParseFailures.push("Gider");
  if (bank.parseFailed) moneyParseFailures.push("Banka");
  if (creditCard.parseFailed) moneyParseFailures.push("Kredi Kartı");
  if (remainingDebt.parseFailed) moneyParseFailures.push("Kalan Borç");
  if (moneyParseFailures.length > 0) {
    errors.push(`Tutar çözümlenemedi: ${moneyParseFailures.join(", ")}`);
  }

  // Kategori belirleme (istenen öncelik sırası).
  let category: LegacyRowCategory;
  if (errors.length > 0) {
    category = "review";
  } else if (hasCargoSignal) {
    category = "cargo";
  } else if (hasExpense || hasExpenseKeyword) {
    category = "expense";
  } else if (hasCollectionKeyword || hasPayment) {
    category = "collection";
  } else if (hasSaleAmount || hasTransactionKeyword || hasDeviceSignal) {
    category = "patient_transaction";
  } else if (hasStockSignal) {
    category = "stock";
  } else {
    category = "info";
  }

  if (
    !phone &&
    (category === "patient_transaction" ||
      category === "collection" ||
      category === "info")
  ) {
    warnings.push("Telefon yok");
  }

  if (
    !patientName &&
    !sender &&
    (category === "patient_transaction" || category === "collection")
  ) {
    warnings.push("Hasta adı yok");
  }

  if (!procedure && !note && (hasSaleAmount || hasPayment)) {
    warnings.push("İşlem tipi belirsiz");
  }

  if (hasPayment && !procedure && !note && !hasCollectionKeyword) {
    warnings.push("Ödeme ilişkisi belirsiz");
  }

  if (hasRemainingDebt && !hasSaleAmount) {
    warnings.push("Kalan borç var, satış yok");
  }

  if (
    hasRemainingDebt &&
    hasSaleAmount &&
    remainingDebt.value != null &&
    saleAmount.value != null &&
    remainingDebt.value > saleAmount.value
  ) {
    warnings.push("Tutar çelişkili");
  }

  if (category !== "stock" && hasStockSignal) {
    warnings.push("Stok olabilir");
  }

  const estimatedPaid =
    hasSaleAmount && remainingDebt.value != null && saleAmount.value != null
      ? saleAmount.value - remainingDebt.value
      : null;

  const confidenceLabel: LegacyConfidenceLabel =
    errors.length > 0 || category === "review"
      ? "düşük"
      : warnings.length > 0
        ? "orta"
        : "yüksek";

  return {
    rowNumber,
    rawData,
    normalized: {
      branch,
      dateISO: dateResult.iso,
      dateRaw: dateResult.raw,
      dateStatus: dateResult.status,
      sender,
      patientName,
      procedure,
      note,
      phone,
      phoneSource,
      saleAmount: saleAmount.value,
      income: income.value,
      expense: expense.value,
      bank: bank.value,
      creditCard: creditCard.value,
      remainingDebt: remainingDebt.value,
      commission: commission.value,
      estimatedPaid,
      incoming,
      outgoing,
      cargoCompany,
      cargoBranch,
      trackingNo,
      documentNo,
      brand,
      model,
      serialNo,
      earSide,
      staff,
    },
    category,
    warnings,
    errors,
    confidenceLabel,
  };
}

// ---------------------------------------------------------------------------
// Sheet analizi
// ---------------------------------------------------------------------------

// XFD gibi hayalet aralıklara karşı okuma limitleri.
const MAX_SCAN_COLUMNS = 128;
const HEADER_SEARCH_ROWS = 20;
const MAX_DATA_ROWS = 20000;
const EMPTY_ROW_BREAK = 200;

function emptySummary(sheetName: string): LegacyImportSummary {
  return {
    sheetName,
    totalRowsScanned: 0,
    meaningfulRows: 0,
    patientTransactionCount: 0,
    collectionCount: 0,
    expenseCount: 0,
    cargoCount: 0,
    stockCount: 0,
    infoCount: 0,
    reviewCount: 0,
    phoneMissingCount: 0,
    invalidDateCount: 0,
    saleAmountTotal: 0,
    incomeTotal: 0,
    expenseTotal: 0,
    bankCardTotal: 0,
    remainingDebtTotal: 0,
  };
}

function isCellEmpty(value: unknown) {
  return value == null || String(value).trim() === "";
}

function normalizedCell(value: unknown) {
  return normalizeLegacyText(toDisplayText(value));
}

function isRepeatedHeaderRow(fieldValues: FieldValues) {
  const entries = Object.entries(fieldValues) as Array<[LegacyFieldKey, unknown]>;
  if (entries.length === 0) {
    return false;
  }

  let mappedHeaderLikeCells = 0;
  for (const [field, value] of entries) {
    const text = toDisplayText(value);
    if (!text) {
      continue;
    }
    if (mapLegacyHeader(text) === field) {
      mappedHeaderLikeCells += 1;
    }
  }

  if (mappedHeaderLikeCells >= 2) {
    return true;
  }

  const dateText = normalizedCell(fieldValues.date);
  if (dateText === "tarih") {
    return true;
  }

  const procedureText = normalizedCell(fieldValues.procedure);
  const nonEmptyFields = entries.filter(([, value]) => !isCellEmpty(value));
  const procedureOnly =
    nonEmptyFields.length === 1 && !isCellEmpty(fieldValues.procedure);

  return (
    procedureOnly &&
    (procedureText === "gelen kargo" ||
      procedureText === "giden kargo" ||
      procedureText === "kargo")
  );
}

function summarizeTopProcedures(rows: LegacyImportRowAnalysis[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = row.normalized.procedure ?? row.normalized.note;
    if (!value) {
      continue;
    }

    const key = value.trim();
    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "tr"))
    .slice(0, 20);
}

export function analyzeLegacySheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
): LegacyImportAnalysis {
  const sheet = workbook.Sheets[sheetName];
  const ref = sheet?.["!ref"];

  const emptyResult: LegacyImportAnalysis = {
    sheetName,
    headerRowNumber: 0,
    columns: [],
    unmappedHeaders: [],
    mappedHeaders: [],
    topProcedures: [],
    rows: [],
    summary: emptySummary(sheetName),
  };

  if (!sheet || !ref) {
    return emptyResult;
  }

  const range = XLSX.utils.decode_range(ref);
  const colStart = range.s.c;
  const colEnd = Math.min(range.e.c, colStart + MAX_SCAN_COLUMNS - 1);

  const readCell = (r: number, c: number): unknown =>
    sheet[XLSX.utils.encode_cell({ r, c })]?.v;

  // Başlık satırını bul: bilinen alanlara en çok eşleşen satır.
  const headerSearchEnd = Math.min(
    range.e.r,
    range.s.r + HEADER_SEARCH_ROWS - 1,
  );
  let headerRow = -1;
  let bestMapped = 0;
  let firstNonEmptyRow = -1;

  for (let r = range.s.r; r <= headerSearchEnd; r += 1) {
    let nonEmpty = 0;
    let mapped = 0;
    for (let c = colStart; c <= colEnd; c += 1) {
      const value = readCell(r, c);
      if (isCellEmpty(value)) {
        continue;
      }
      nonEmpty += 1;
      if (typeof value === "string" && mapLegacyHeader(value)) {
        mapped += 1;
      }
    }
    if (nonEmpty > 0 && firstNonEmptyRow === -1) {
      firstNonEmptyRow = r;
    }
    if (mapped > bestMapped) {
      bestMapped = mapped;
      headerRow = r;
    }
  }

  if (headerRow === -1) {
    headerRow = firstNonEmptyRow;
  }

  if (headerRow === -1) {
    return emptyResult;
  }

  // Sadece gerçek başlığı olan kolonları oku; boş kolonları yok say.
  const columns: LegacyColumnInfo[] = [];
  for (let c = colStart; c <= colEnd; c += 1) {
    const value = readCell(headerRow, c);
    if (isCellEmpty(value)) {
      continue;
    }
    const header = String(value).trim();
    columns.push({ columnIndex: c, header, field: mapLegacyHeader(header) });
  }

  if (columns.length === 0) {
    return emptyResult;
  }

  const unmappedHeaders = columns
    .filter((column) => column.field == null)
    .map((column) => column.header);
  const mappedHeaders = columns.filter((column) => column.field != null);

  const isCargoSheet = normalizeLegacyText(sheetName).includes("kargo");

  const rows: LegacyImportRowAnalysis[] = [];
  const summary = emptySummary(sheetName);

  const dataRowEnd = Math.min(range.e.r, headerRow + MAX_DATA_ROWS);
  let consecutiveEmpty = 0;

  for (let r = headerRow + 1; r <= dataRowEnd; r += 1) {
    const rawData: Record<string, unknown> = {};
    const fieldValues: FieldValues = {};
    let hasValue = false;

    for (const column of columns) {
      const value = readCell(r, column.columnIndex);
      if (isCellEmpty(value)) {
        continue;
      }
      hasValue = true;
      rawData[column.header] = value;
      // Aynı alana eşlenen birden fazla kolonda ilk dolu değer kazanır.
      if (column.field && fieldValues[column.field] === undefined) {
        fieldValues[column.field] = value;
      }
    }

    summary.totalRowsScanned += 1;

    if (!hasValue) {
      consecutiveEmpty += 1;
      if (consecutiveEmpty >= EMPTY_ROW_BREAK) {
        summary.totalRowsScanned -= consecutiveEmpty;
        break;
      }
      continue;
    }

    consecutiveEmpty = 0;

    if (isRepeatedHeaderRow(fieldValues)) {
      continue;
    }

    const analysis = analyzeLegacyRow(fieldValues, rawData, r + 1, isCargoSheet);
    rows.push(analysis);

    summary.meaningfulRows += 1;

    switch (analysis.category) {
      case "patient_transaction":
        summary.patientTransactionCount += 1;
        break;
      case "collection":
        summary.collectionCount += 1;
        break;
      case "expense":
        summary.expenseCount += 1;
        break;
      case "cargo":
        summary.cargoCount += 1;
        break;
      case "stock":
        summary.stockCount += 1;
        break;
      case "info":
        summary.infoCount += 1;
        break;
      case "review":
        summary.reviewCount += 1;
        break;
    }

    if (analysis.warnings.includes("Telefon yok")) {
      summary.phoneMissingCount += 1;
    }
    if (analysis.normalized.dateStatus === "invalid") {
      summary.invalidDateCount += 1;
    }

    summary.saleAmountTotal += analysis.normalized.saleAmount ?? 0;
    summary.incomeTotal += analysis.normalized.income ?? 0;
    summary.expenseTotal += analysis.normalized.expense ?? 0;
    summary.bankCardTotal +=
      (analysis.normalized.bank ?? 0) + (analysis.normalized.creditCard ?? 0);
    summary.remainingDebtTotal += analysis.normalized.remainingDebt ?? 0;
  }

  return {
    sheetName,
    headerRowNumber: headerRow + 1,
    columns,
    unmappedHeaders,
    mappedHeaders,
    topProcedures: summarizeTopProcedures(rows),
    rows,
    summary,
  };
}

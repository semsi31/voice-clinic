import {
  normalizeLegacyText,
  type LegacyImportAnalysis,
  type LegacyImportRowAnalysis,
} from "@/lib/legacy-import";

export type LegacyTransformTarget =
  | "cargo_records"
  | "finance_expense"
  | "patient_transaction"
  | "review_required"
  | "skip";

export type LegacyTransformPayment = {
  method: "cash" | "bank_transfer" | "credit_card";
  amount: number;
};

export type LegacyTransformRow = {
  rowNumber: number;
  sheetName: string;
  target: LegacyTransformTarget;
  date: string | null;
  personName: string | null;
  operation: string | null;
  suggestedAmount: number | null;
  suggestedPaymentTotal: number;
  paymentMethods: LegacyTransformPayment[];
  remainingDebt: number | null;
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  earSide: string | null;
  risks: string[];
  note: string | null;
  payload: Record<string, unknown>;
};

export type LegacyTransformSummary = {
  cargoRecordsCount: number;
  financeExpenseCount: number;
  patientTransactionCount: number;
  reviewRequiredCount: number;
  skipCount: number;
  estimatedSaleTotal: number;
  suggestedPaymentTotal: number;
  estimatedExpenseTotal: number;
  cargoRecordCount: number;
  transferableMissingPhoneCount: number;
  dateFixRequiredCount: number;
};

export type LegacyTransformPlan = {
  sheetName: string;
  rows: LegacyTransformRow[];
  summary: LegacyTransformSummary;
};

const PATIENT_TRANSACTION_OPERATIONS = [
  "cihaz satisi",
  "cihaz tamiri",
  "cihaz tamir alis",
  "cihaz tamir teslim",
  "cihaz teslim",
  "cihaz ayari",
  "tamir cihazi",
  "tamir cihaz teslim",
  "yedek parca",
  "kalip teslim",
  "kalip alis",
  "kalip tamir alis",
  "kalip tamir teslim",
  "pil satisi",
  "aksesuar",
  "tamir",
];

const CARGO_COMPANY_PATTERNS = [
  { label: "MNG", pattern: /\bmng\b/i },
  { label: "Yurtiçi", pattern: /\byurt\s*i[cç]i\b|\byurti[cç]i\b/i },
  { label: "Aras", pattern: /\baras\b/i },
  { label: "PTT", pattern: /\bptt\b/i },
  { label: "Sürat", pattern: /\bs[uü]rat\b/i },
];

function emptySummary(): LegacyTransformSummary {
  return {
    cargoRecordsCount: 0,
    financeExpenseCount: 0,
    patientTransactionCount: 0,
    reviewRequiredCount: 0,
    skipCount: 0,
    estimatedSaleTotal: 0,
    suggestedPaymentTotal: 0,
    estimatedExpenseTotal: 0,
    cargoRecordCount: 0,
    transferableMissingPhoneCount: 0,
    dateFixRequiredCount: 0,
  };
}

function textParts(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").trim();
}

function normalizeOperation(value: string | null) {
  return normalizeLegacyText(value ?? "");
}

function rowOperationText(row: LegacyImportRowAnalysis) {
  return textParts(row.normalized.procedure, row.normalized.note);
}

function isNetPatientOperation(row: LegacyImportRowAnalysis) {
  const normalized = normalizeOperation(rowOperationText(row));
  return PATIENT_TRANSACTION_OPERATIONS.some((allowed) =>
    normalized.includes(allowed),
  );
}

function isInfoOnlyRow(row: LegacyImportRowAnalysis) {
  const operation = normalizeOperation(row.normalized.procedure);
  const note = normalizeOperation(row.normalized.note);
  const combined = `${operation} ${note}`.trim();
  return (
    combined.includes("hasta bilgisi") ||
    combined.includes("gorusme") ||
    combined.includes("gorusmesi") ||
    combined.includes("cihaz gorusmesi") ||
    combined.includes("yonlendirme") ||
    combined.includes("aciklama") ||
    combined.includes("hasta girisi yok") ||
    combined.includes("bilgi")
  );
}

function estimateSaleAmount(row: LegacyImportRowAnalysis) {
  const explicitSale = row.normalized.saleAmount;
  if (explicitSale != null && explicitSale > 0) {
    return explicitSale;
  }

  const inferred =
    (row.normalized.income ?? 0) +
    (row.normalized.bank ?? 0) +
    (row.normalized.creditCard ?? 0) +
    (row.normalized.remainingDebt ?? 0);

  return inferred > 0 ? inferred : null;
}

function buildPayments(row: LegacyImportRowAnalysis): LegacyTransformPayment[] {
  const payments: LegacyTransformPayment[] = [];

  if (row.normalized.income != null && row.normalized.income > 0) {
    payments.push({ method: "cash", amount: row.normalized.income });
  }

  if (row.normalized.bank != null && row.normalized.bank > 0) {
    payments.push({ method: "bank_transfer", amount: row.normalized.bank });
  }

  if (row.normalized.creditCard != null && row.normalized.creditCard > 0) {
    payments.push({
      method: "credit_card",
      amount: row.normalized.creditCard,
    });
  }

  return payments;
}

function paymentTotal(payments: LegacyTransformPayment[]) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

function extractCargoCompany(note: string | null) {
  if (!note) {
    return null;
  }

  for (const company of CARGO_COMPANY_PATTERNS) {
    if (company.pattern.test(note)) {
      return company.label;
    }
  }

  return null;
}

function extractTrackingNumber(note: string | null) {
  if (!note) {
    return null;
  }

  const explicit = note.match(
    /(?:takip|barkod|g[oö]nderi)\s*(?:no|numarasi|numarası|kodu)?\s*[:#-]?\s*([A-Z0-9]{8,})/i,
  );
  if (explicit?.[1]) {
    return explicit[1];
  }

  const generic = note.match(/\b[A-Z0-9]{10,}\b/i);
  return generic?.[0] ?? null;
}

function cargoProcessDescription(row: LegacyImportRowAnalysis) {
  const operation = normalizeOperation(row.normalized.procedure);
  const note = normalizeOperation(row.normalized.note);
  const combined = `${operation} ${note}`.trim();

  if (combined.includes("gelen kargo")) {
    return "GELEN KARGO";
  }

  if (combined.includes("giden kargo")) {
    return "GİDEN KARGO";
  }

  return row.normalized.procedure ?? "KARGO";
}

function buildCargoRow(
  analysis: LegacyImportAnalysis,
  row: LegacyImportRowAnalysis,
): LegacyTransformRow {
  const risks = [...row.errors, ...row.warnings];
  const note = row.normalized.note;
  const cargoCompany =
    row.normalized.cargoCompany ?? extractCargoCompany(note) ?? null;
  const trackingNumber =
    row.normalized.trackingNo ?? extractTrackingNumber(note) ?? null;
  const senderName =
    row.normalized.cargoCompany ??
    row.normalized.patientName ??
    row.normalized.sender ??
    null;

  return {
    rowNumber: row.rowNumber,
    sheetName: analysis.sheetName,
    target: "cargo_records",
    date: row.normalized.dateISO,
    personName: senderName,
    operation: cargoProcessDescription(row),
    suggestedAmount: null,
    suggestedPaymentTotal: 0,
    paymentMethods: [],
    remainingDebt: row.normalized.remainingDebt,
    brand: row.normalized.brand,
    model: row.normalized.model,
    serialNo: row.normalized.serialNo,
    earSide: row.normalized.earSide,
    risks,
    note,
    payload: {
      table: "cargo_records",
      status: "delivered",
      cargo_date: row.normalized.dateISO,
      sender_name: senderName,
      process_description: cargoProcessDescription(row),
      cargo_company: cargoCompany,
      cargo_branch: row.normalized.cargoBranch,
      tracking_number: trackingNumber,
      note,
    },
  };
}

function buildExpenseRow(
  analysis: LegacyImportAnalysis,
  row: LegacyImportRowAnalysis,
): LegacyTransformRow {
  const description = textParts(row.normalized.note, row.normalized.procedure);
  const responsiblePerson = row.normalized.sender ?? row.normalized.staff;

  return {
    rowNumber: row.rowNumber,
    sheetName: analysis.sheetName,
    target: "finance_expense",
    date: row.normalized.dateISO,
    personName: responsiblePerson,
    operation: row.normalized.procedure,
    suggestedAmount: row.normalized.expense,
    suggestedPaymentTotal: 0,
    paymentMethods: [],
    remainingDebt: row.normalized.remainingDebt,
    brand: row.normalized.brand,
    model: row.normalized.model,
    serialNo: row.normalized.serialNo,
    earSide: row.normalized.earSide,
    risks: [...row.errors, ...row.warnings],
    note: row.normalized.note,
    payload: {
      table: "finance_records",
      type: "expense",
      record_date: row.normalized.dateISO,
      amount: row.normalized.expense,
      description,
      responsible_person: responsiblePerson,
      payment_method: "other",
    },
  };
}

function buildPatientTransactionRow(
  analysis: LegacyImportAnalysis,
  row: LegacyImportRowAnalysis,
): LegacyTransformRow {
  const estimatedSaleAmount = estimateSaleAmount(row);
  const saleAmount = estimatedSaleAmount ?? 0;
  const payments = buildPayments(row);
  const suggestedPaymentTotal = paymentTotal(payments);
  const risks = [...row.errors, ...row.warnings];

  if (!row.normalized.phone && !risks.includes("Telefon yok")) {
    risks.push("Telefon yok");
  }

  if (estimatedSaleAmount == null) {
    risks.push("Tutar yok.");
  }

  return {
    rowNumber: row.rowNumber,
    sheetName: analysis.sheetName,
    target: "patient_transaction",
    date: row.normalized.dateISO,
    personName: row.normalized.patientName ?? row.normalized.sender,
    operation: row.normalized.procedure,
    suggestedAmount: saleAmount,
    suggestedPaymentTotal,
    paymentMethods: payments,
    remainingDebt: row.normalized.remainingDebt,
    brand: row.normalized.brand,
    model: row.normalized.model,
    serialNo: row.normalized.serialNo,
    earSide: row.normalized.earSide,
    risks,
    note: row.normalized.note,
    payload: {
      table: "patient_transactions",
      patient_name: row.normalized.patientName ?? row.normalized.sender,
      transaction_date: row.normalized.dateISO,
      operation_description: row.normalized.procedure,
      brand: row.normalized.brand,
      model: row.normalized.model,
      serial_no: row.normalized.serialNo,
      ear_side: row.normalized.earSide,
      responsible_person: row.normalized.staff ?? row.normalized.sender,
      description: row.normalized.note,
      sale_amount: saleAmount,
      phone: row.normalized.phone ?? "",
      payments,
      remaining_debt: row.normalized.remainingDebt,
      stock_deduct_enabled: false,
    },
  };
}

function buildReviewRow(
  analysis: LegacyImportAnalysis,
  row: LegacyImportRowAnalysis,
  risks: string[],
): LegacyTransformRow {
  return {
    rowNumber: row.rowNumber,
    sheetName: analysis.sheetName,
    target: "review_required",
    date: row.normalized.dateISO,
    personName: row.normalized.patientName ?? row.normalized.sender,
    operation: row.normalized.procedure,
    suggestedAmount: estimateSaleAmount(row) ?? row.normalized.expense,
    suggestedPaymentTotal: paymentTotal(buildPayments(row)),
    paymentMethods: buildPayments(row),
    remainingDebt: row.normalized.remainingDebt,
    brand: row.normalized.brand,
    model: row.normalized.model,
    serialNo: row.normalized.serialNo,
    earSide: row.normalized.earSide,
    risks,
    note: row.normalized.note,
    payload: {
      table: "review_required",
      reason: risks.join(" "),
      rawData: row.rawData,
    },
  };
}

function buildSkipRow(
  analysis: LegacyImportAnalysis,
  row: LegacyImportRowAnalysis,
  reason: string,
): LegacyTransformRow {
  return {
    rowNumber: row.rowNumber,
    sheetName: analysis.sheetName,
    target: "skip",
    date: row.normalized.dateISO,
    personName: row.normalized.patientName ?? row.normalized.sender,
    operation: row.normalized.procedure,
    suggestedAmount: null,
    suggestedPaymentTotal: 0,
    paymentMethods: [],
    remainingDebt: row.normalized.remainingDebt,
    brand: row.normalized.brand,
    model: row.normalized.model,
    serialNo: row.normalized.serialNo,
    earSide: row.normalized.earSide,
    risks: [reason],
    note: row.normalized.note,
    payload: {
      table: "skip",
      reason,
    },
  };
}

function transformRow(analysis: LegacyImportAnalysis, row: LegacyImportRowAnalysis) {
  const sheetIsCargo = normalizeLegacyText(analysis.sheetName).includes("kargo");

  if (row.normalized.dateStatus === "invalid") {
    return buildReviewRow(analysis, row, [
      ...row.errors,
      ...row.warnings,
      "Tarih düzeltilmeli.",
    ]);
  }

  if (sheetIsCargo && row.category === "cargo") {
    return buildCargoRow(analysis, row);
  }

  if (isInfoOnlyRow(row)) {
    return buildSkipRow(analysis, row, "Bilgi amaçlı satır.");
  }

  if (isNetPatientOperation(row)) {
    return buildPatientTransactionRow(analysis, row);
  }

  if (row.category === "expense") {
    return buildExpenseRow(analysis, row);
  }

  if (row.category === "collection") {
    const risks = [
      ...row.errors,
      ...row.warnings,
      "Tahsilatın hangi işleme ait olduğu belirsiz.",
    ];

    if (
      (row.normalized.patientName || row.normalized.sender) &&
      row.normalized.documentNo &&
      (row.normalized.remainingDebt || row.normalized.saleAmount)
    ) {
      risks.push("Manuel eşleştirilebilir.");
    }

    return buildReviewRow(analysis, row, risks);
  }

  if (row.category === "patient_transaction") {
    return buildReviewRow(analysis, row, [
      ...row.errors,
      ...row.warnings,
      "Hasta işlem tipi gerçek import için net değil.",
    ]);
  }

  if (row.category === "info") {
    return buildSkipRow(analysis, row, "Bilgi amaçlı satır.");
  }

  return buildReviewRow(analysis, row, [
    ...row.errors,
    ...row.warnings,
    "Dönüşüm hedefi belirsiz.",
  ]);
}

export function buildLegacyTransformPlan(
  analysis: LegacyImportAnalysis,
): LegacyTransformPlan {
  const rows = analysis.rows.map((row) => transformRow(analysis, row));
  const summary = emptySummary();

  for (const row of rows) {
    switch (row.target) {
      case "cargo_records":
        summary.cargoRecordsCount += 1;
        summary.cargoRecordCount += 1;
        break;
      case "finance_expense":
        summary.financeExpenseCount += 1;
        summary.estimatedExpenseTotal += row.suggestedAmount ?? 0;
        break;
      case "patient_transaction":
        summary.patientTransactionCount += 1;
        summary.estimatedSaleTotal += row.suggestedAmount ?? 0;
        summary.suggestedPaymentTotal += row.suggestedPaymentTotal;
        if (!row.payload.phone) {
          summary.transferableMissingPhoneCount += 1;
        }
        break;
      case "review_required":
        summary.reviewRequiredCount += 1;
        break;
      case "skip":
        summary.skipCount += 1;
        break;
    }

    if (row.risks.some((risk) => risk.includes("Tarih düzeltilmeli"))) {
      summary.dateFixRequiredCount += 1;
    }
  }

  return {
    sheetName: analysis.sheetName,
    rows,
    summary,
  };
}

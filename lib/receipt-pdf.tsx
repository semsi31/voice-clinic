import "server-only";

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import type { PaymentMethod } from "@/lib/transactions";

type ReceiptPdfParams = {
  transaction: {
    transaction_no: string | null;
    patient_name: string;
    operation_description: string;
    sale_amount: number | string;
    responsible_person?: string | null;
    staff_name: string | null;
  };
  payment: {
    payment_date: string;
    payment_method: PaymentMethod;
    amount: number | string;
    description: string | null;
    received_by: string | null;
  };
  fallbackReceivedBy?: string | null;
};

const dejavuFontDir = path.join(process.cwd(), "node_modules", "dejavu-fonts-ttf", "ttf");
const logoPath = path.join(process.cwd(), "public", "images", "voice-logo.png");
const regularFontPath = path.join(dejavuFontDir, "DejaVuSans.ttf");
const boldFontPath = path.join(dejavuFontDir, "DejaVuSans-Bold.ttf");
let cachedLogoBuffer: Buffer | null = null;
let logoLoadAttempted = false;

type ReceiptFontSet = {
  regular: string;
  bold: string;
};

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { error };
  }

  const knownError = error as { message?: unknown; stack?: unknown };

  return {
    message: knownError.message,
    stack: knownError.stack,
    error,
  };
}

async function getReceiptLogoBuffer() {
  if (cachedLogoBuffer || logoLoadAttempted) {
    return cachedLogoBuffer;
  }

  logoLoadAttempted = true;

  try {
    const logoFile = fs.readFileSync(logoPath);

    try {
      cachedLogoBuffer = await sharp(logoFile)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 92 })
        .toBuffer();
    } catch (error) {
      console.error("Receipt logo normalization failed, using raw logo", {
        logoPath,
        error: errorDetails(error),
      });
      cachedLogoBuffer = logoFile;
    }
  } catch (error) {
    console.error("Receipt logo load failed, using text fallback", {
      logoPath,
      error: errorDetails(error),
    });
    cachedLogoBuffer = null;
  }

  return cachedLogoBuffer;
}

function registerReceiptFonts(doc: PDFKit.PDFDocument): ReceiptFontSet {
  const fonts: ReceiptFontSet = {
    regular: fs.existsSync(regularFontPath) ? regularFontPath : "Helvetica",
    bold: fs.existsSync(boldFontPath) ? boldFontPath : "Helvetica-Bold",
  };

  try {
    doc.registerFont("regular", regularFontPath);
  } catch (error) {
    console.error("Receipt regular font registration failed, using PDF fallback", {
      regularFontPath,
      error: errorDetails(error),
    });
  }

  try {
    doc.registerFont("bold", boldFontPath);
  } catch (error) {
    console.error("Receipt bold font registration failed, using PDF fallback", {
      boldFontPath,
      error: errorDetails(error),
    });
  }

  return fonts;
}

function getDefaultReceiptFontPath() {
  if (fs.existsSync(regularFontPath)) {
    return regularFontPath;
  }

  console.error("Receipt default font file missing, PDFKit fallback may be used", {
    regularFontPath,
  });
  return undefined;
}

function drawLogoFallback(doc: PDFKit.PDFDocument, fonts: ReceiptFontSet) {
  doc.circle(79, 75, 25).fillColor(colors.goldPale).fill();
  doc.circle(79, 75, 25).lineWidth(1).strokeColor(colors.border).stroke();
  doc.circle(79, 75, 20).lineWidth(0.4).strokeColor(colors.goldLight).stroke();
  doc
    .font(fonts.bold)
    .fontSize(14)
    .fillColor(colors.goldDark)
    .text("VC", 54, 66, {
      width: 50,
      height: 18,
      align: "center",
      characterSpacing: 1,
    });
}

const colors = {
  paper: "#fffdf8",
  ink: "#1f2933",
  muted: "#667085",
  mutedLight: "#98a2b3",
  gold: "#b8892f",
  goldDark: "#8d6418",
  goldLight: "#ead8a8",
  goldPale: "#fff9ea",
  border: "#dfc27a",
  borderSoft: "#efe2be",
};

const ones = [
  "",
  "bir",
  "iki",
  "üç",
  "dört",
  "beş",
  "altı",
  "yedi",
  "sekiz",
  "dokuz",
];
const tens = [
  "",
  "on",
  "yirmi",
  "otuz",
  "kırk",
  "elli",
  "altmış",
  "yetmiş",
  "seksen",
  "doksan",
];
const scales = ["", "bin", "milyon", "milyar", "trilyon"];

function cleanDisplayText(value: string | null | undefined, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function toTitleCaseTurkish(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const first = word.slice(0, 1).toLocaleUpperCase("tr-TR");
      const rest = word.slice(1).toLocaleLowerCase("tr-TR");
      return `${first}${rest}`;
    })
    .join(" ");
}

function parseAmount(value: number | string) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = value.replace(/[₺\s]/g, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function underThousandToWords(value: number) {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const one = value % 10;
  const parts: string[] = [];

  if (hundred > 0) {
    parts.push(hundred === 1 ? "yüz" : `${ones[hundred]} yüz`);
  }

  if (ten > 0) {
    parts.push(tens[ten]);
  }

  if (one > 0) {
    parts.push(ones[one]);
  }

  return parts.join(" ");
}

function integerToTurkishWords(value: number) {
  if (value === 0) {
    return "sıfır";
  }

  const parts: string[] = [];
  let remaining = Math.floor(Math.abs(value));
  let scaleIndex = 0;

  while (remaining > 0 && scaleIndex < scales.length) {
    const group = remaining % 1000;

    if (group > 0) {
      const groupText =
        group === 1 && scaleIndex === 1
          ? scales[scaleIndex]
          : `${underThousandToWords(group)} ${scales[scaleIndex]}`.trim();
      parts.unshift(groupText);
    }

    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return parts.join(" ");
}

export function formatTurkishCurrencyText(amount: number | string) {
  const safeAmount = Math.max(0, parseAmount(amount));
  let lira = Math.floor(safeAmount);
  let kurus = Math.round((safeAmount - lira) * 100);

  if (kurus === 100) {
    lira += 1;
    kurus = 0;
  }

  const liraText = `${toTitleCaseTurkish(integerToTurkishWords(lira))} Türk Lirası`;

  if (kurus <= 0) {
    return liraText;
  }

  return `${liraText} ${toTitleCaseTurkish(integerToTurkishWords(kurus))} Kuruş`;
}

export function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    cash: "Nakit",
    credit_card: "Kredi Kartı",
    bank_transfer: "Havale",
  };

  return labels[method] ?? method;
}

function formatReceiptDate(value: string) {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return cleanDisplayText(value);
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatReceiptAmount(value: number | string) {
  const amount = parseAmount(value);
  return `₺${amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function collectPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function drawFieldRow({
  doc,
  fonts,
  label,
  value,
  y,
  height,
  valueFontSize = 10.8,
  valueFont = "regular",
}: {
  doc: PDFKit.PDFDocument;
  fonts: ReceiptFontSet;
  label: string;
  value: string;
  y: number;
  height: number;
  valueFontSize?: number;
  valueFont?: "regular" | "bold";
}) {
  const x = 57;
  const width = 481;
  const labelWidth = 132;

  doc
    .roundedRect(x, y, width, height, 7)
    .fillColor("#ffffff")
    .fill();
  doc
    .roundedRect(x, y, width, height, 7)
    .lineWidth(0.8)
    .strokeColor(colors.borderSoft)
    .stroke();
  doc.rect(x + 1, y + 1, labelWidth - 1, height - 2).fillColor(colors.goldPale).fill();
  doc
    .moveTo(x + labelWidth, y)
    .lineTo(x + labelWidth, y + height)
    .strokeColor(colors.borderSoft)
    .stroke();

  doc
    .font(fonts.bold)
    .fontSize(8.4)
    .fillColor(colors.goldDark)
    .text(label, x + 13, y + 11, {
      width: labelWidth - 24,
      height: height - 16,
      characterSpacing: 0.7,
      lineGap: 1,
    });

  doc
    .font(valueFont === "bold" ? fonts.bold : fonts.regular)
    .fontSize(valueFontSize)
    .fillColor(colors.ink)
    .text(value, x + labelWidth + 15, y + 10, {
      width: width - labelWidth - 28,
      height: height - 14,
      lineGap: 3,
    });
}

function drawContactItem({
  doc,
  fonts,
  label,
  value,
  x,
  y,
  width,
}: {
  doc: PDFKit.PDFDocument;
  fonts: ReceiptFontSet;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
}) {
  const valueHeight = value.includes("\n") ? 38 : 12;

  doc.circle(x + 5, y + 5.5, 3).fillColor(colors.gold).fill();
  doc
    .font(fonts.bold)
    .fontSize(7.6)
    .fillColor(colors.goldDark)
    .text(label, x + 16, y - 1, {
      width: width - 16,
      height: 10,
    });
  doc
    .font(fonts.regular)
    .fontSize(7.7)
    .fillColor(colors.ink)
    .text(value, x + 16, y + 12, {
      width: width - 16,
      height: valueHeight,
      lineGap: 1.6,
    });
}

export async function generatePaymentReceiptPdfBuffer({
  transaction,
  payment,
  fallbackReceivedBy,
}: ReceiptPdfParams) {
  const transactionNo = cleanDisplayText(transaction.transaction_no);
  const patientName = cleanDisplayText(transaction.patient_name);
  const description = cleanDisplayText(payment.description);
  const receivedBy = cleanDisplayText(
    payment.received_by ||
      transaction.responsible_person ||
      transaction.staff_name ||
      fallbackReceivedBy,
    "Voice Klinik",
  );
  const collectedAmount = formatReceiptAmount(payment.amount);
  const amountText = formatTurkishCurrencyText(payment.amount);
  const logoBuffer = await getReceiptLogoBuffer();
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    font: getDefaultReceiptFontPath(),
    info: {
      Title: `Tahsilat Makbuzu - ${transactionNo}`,
      Author: "Voice Klinik",
      Subject: "Tahsilat Makbuzu",
    },
  });
  const bufferPromise = collectPdfBuffer(doc);
  const fonts = registerReceiptFonts(doc);

  doc.rect(0, 0, 595, 842).fillColor(colors.paper).fill();
  doc.rect(32, 24, 531, 788).lineWidth(1).strokeColor(colors.border).stroke();
  doc.rect(39, 31, 517, 774).lineWidth(0.45).strokeColor(colors.goldLight).stroke();

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 56, 48, { fit: [54, 54] });
    } catch (error) {
      console.error("Receipt logo draw failed, using text fallback", {
        logoPath,
        error: errorDetails(error),
      });
      drawLogoFallback(doc, fonts);
    }
  } else {
    drawLogoFallback(doc, fonts);
  }

  doc.font(fonts.bold).fontSize(15.5).fillColor(colors.ink).text("VOICE KLİNİK", 124, 58, {
    width: 180,
    height: 18,
    characterSpacing: 1.5,
  });
  doc
    .font(fonts.regular)
    .fontSize(8)
    .fillColor(colors.muted)
    .text("İşitme ve Danışmanlık Merkezi", 124, 80, {
      width: 190,
      height: 12,
      characterSpacing: 0.4,
    });
  doc
    .moveTo(124, 96)
    .lineTo(248, 96)
    .lineWidth(0.5)
    .strokeColor(colors.goldLight)
    .stroke();

  doc
    .roundedRect(336, 45, 202, 108, 9)
    .fillColor("#ffffff")
    .fill();
  doc
    .roundedRect(336, 45, 202, 108, 9)
    .lineWidth(0.55)
    .strokeColor(colors.borderSoft)
    .stroke();
  doc
    .font(fonts.bold)
    .fontSize(8.3)
    .fillColor(colors.goldDark)
    .text("İletişim", 350, 55, {
      width: 174,
      height: 12,
      align: "right",
    });
  doc.moveTo(350, 76).lineTo(350, 139).lineWidth(0.65).strokeColor(colors.gold).stroke();
  drawContactItem({
    doc,
    fonts,
    label: "Adres",
    value: "Akasya Mahallesi\n186. Sokak A Blok\nNo: 4 İç Kapı: 6\nAntakya / Hatay",
    x: 360,
    y: 74,
    width: 174,
  });
  drawContactItem({
    doc,
    fonts,
    label: "Telefon",
    value: "0532 217 31 58",
    x: 360,
    y: 131,
    width: 174,
  });

  doc
    .moveTo(57, 162)
    .lineTo(538, 162)
    .lineWidth(0.55)
    .strokeColor(colors.goldLight)
    .stroke();

  doc
    .font(fonts.bold)
    .fontSize(8.3)
    .fillColor(colors.goldDark)
    .text("VOICE KLİNİK", 57, 174, {
      width: 481,
      height: 11,
      align: "center",
      characterSpacing: 2.7,
    });
  doc
    .font(fonts.bold)
    .fontSize(25)
    .fillColor(colors.ink)
    .text("TAHSİLAT MAKBUZU", 57, 191, {
      width: 481,
      height: 31,
      align: "center",
      characterSpacing: 1.6,
    });
  doc.rect(216, 227, 163, 1).fillColor(colors.gold).fill();

  doc.roundedRect(202, 243, 190, 45, 8).fillColor(colors.goldPale).fill();
  doc.roundedRect(202, 243, 190, 45, 8).lineWidth(0.7).strokeColor(colors.borderSoft).stroke();
  doc
    .font(fonts.bold)
    .fontSize(8)
    .fillColor(colors.goldDark)
    .text("TARİH", 202, 252, {
      width: 190,
      height: 10,
      align: "center",
      characterSpacing: 1.2,
    });
  doc
    .font(fonts.bold)
    .fontSize(12)
    .fillColor(colors.ink)
    .text(formatReceiptDate(payment.payment_date), 202, 266, {
      width: 190,
      height: 16,
      align: "center",
    });

  drawFieldRow({
    doc,
    fonts,
    label: "SAYIN",
    value: patientName,
    y: 304,
    height: 38,
    valueFont: "bold",
    valueFontSize: 12.5,
  });
  drawFieldRow({
    doc,
    fonts,
    label: "AÇIKLAMA",
    value: description,
    y: 352,
    height: 54,
  });
  drawFieldRow({
    doc,
    fonts,
    label: "TAHSİL EDİLEN",
    value: collectedAmount,
    y: 418,
    height: 38,
    valueFont: "bold",
    valueFontSize: 13.8,
  });

  doc.roundedRect(57, 482, 481, 55, 9).fillColor(colors.goldPale).fill();
  doc.roundedRect(57, 482, 481, 55, 9).lineWidth(0.65).strokeColor(colors.borderSoft).stroke();
  doc
    .font(fonts.regular)
    .fontSize(11.2)
    .fillColor(colors.ink)
    .text(`Yalnız ${amountText} tahsil edilmiştir.`, 73, 498, {
      width: 453,
      height: 28,
      lineGap: 4,
    });

  doc.roundedRect(337, 574, 201, 80, 9).fillColor("#ffffff").fill();
  doc.roundedRect(337, 574, 201, 80, 9).lineWidth(0.7).strokeColor(colors.borderSoft).stroke();
  doc.rect(338, 575, 199, 24).fillColor(colors.goldPale).fill();
  doc
    .font(fonts.bold)
    .fontSize(8.8)
    .fillColor(colors.goldDark)
    .text("TAHSİL EDEN", 338, 583, {
      width: 199,
      height: 11,
      align: "center",
      characterSpacing: 1,
    });
  doc.moveTo(356, 623).lineTo(520, 623).lineWidth(0.6).strokeColor(colors.goldLight).stroke();
  doc.font(fonts.bold).fontSize(10.6).fillColor(colors.ink).text(receivedBy, 356, 632, {
    width: 164,
    height: 16,
    align: "center",
  });

  doc.moveTo(57, 698).lineTo(538, 698).lineWidth(0.45).strokeColor(colors.goldLight).stroke();
  doc
    .font(fonts.regular)
    .fontSize(8.1)
    .fillColor(colors.muted)
    .text(
      "Bu makbuz, belirtilen ödemenin tahsil edildiğini kayıt altına almak amacıyla otomatik olarak oluşturulmuştur.",
      57,
      714,
      { width: 481, height: 24, align: "center", lineGap: 3 },
    );

  doc.end();
  return bufferPromise;
}

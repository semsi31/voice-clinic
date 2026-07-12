"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import {
  executeLegacyActivityImportAction,
  type LegacyActivityDateCorrection,
} from "@/app/(panel)/panel/imports/actions";
import { ActionModal } from "@/components/panel/action-modal";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
  panelTableScrollClassName,
} from "@/components/panel/panel-styles";
import {
  type LegacyActivityImportSummary,
  type LegacyActivityPreviewSummary,
} from "@/lib/legacy-activity-import";
import { formatDate } from "@/lib/transactions";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

type LegacyActivityPreviewApiResult =
  | { ok: true; summary: LegacyActivityPreviewSummary }
  | { ok: false; error: string; code?: string };

function SummaryBox({
  label,
  value,
  tone = "default",
}: Readonly<{
  label: string;
  value: number | string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}>) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "red"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : tone === "blue"
            ? "border-sky-200 bg-sky-50 text-sky-900"
            : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function reviewRowKey(sheetName: string, rowNumber: number) {
  return `${sheetName}:${rowNumber}`;
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function LegacyActivityImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<LegacyActivityPreviewSummary | null>(null);
  const [importSummary, setImportSummary] =
    useState<LegacyActivityImportSummary | null>(null);
  const [correctedDates, setCorrectedDates] = useState<Record<string, string>>({});
  const [bulkCorrectedDate, setBulkCorrectedDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReading, startReadTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();

  const handleFile = (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);
    setPreview(null);
    setImportSummary(null);
    setCorrectedDates({});
    setBulkCorrectedDate("");

    const lowerName = file.name.toLocaleLowerCase("tr-TR");
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      setError("Yalnızca .xlsx veya .xls dosyaları desteklenir.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Dosya boyutu 15 MB sınırını aşıyor.");
      return;
    }

    setFileName(file.name);

    startReadTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/legacy-activity-preview", {
          method: "POST",
          body: formData,
        });
        const result = (await response.json()) as LegacyActivityPreviewApiResult;

        if (!result.ok) {
          setError(result.error || "Preview oluşturulamadı.");
          return;
        }

        setPreview(result.summary);
        setCorrectedDates({});
        setBulkCorrectedDate("");
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Preview isteği tamamlanamadı.";
        setError(`Preview oluşturulamadı: ${message}`);
      }
    });
  };

  const handleImport = () => {
    if (!preview) {
      return;
    }

    const dateCorrections: LegacyActivityDateCorrection[] =
      preview.invalidDateReviewRows.flatMap((row) => {
        const key = reviewRowKey(row.sheetName, row.rowNumber);
        const correctedDate = correctedDates[key];

        return correctedDate && isValidDateInput(correctedDate)
          ? [
              {
                sheetName: row.sheetName,
                rowNumber: row.rowNumber,
                correctedDate,
              },
            ]
          : [];
      });

    setError(null);
    startImportTransition(async () => {
      const result = await executeLegacyActivityImportAction(
        preview.batchId,
        dateCorrections,
      );

      if (!result.ok) {
        setError(result.error);
        setIsConfirmOpen(false);
        return;
      }

      setImportSummary(result.summary);
      setIsConfirmOpen(false);
    });
  };

  const correctedInvalidDateCount = useMemo(() => {
    if (!preview) {
      return 0;
    }

    return preview.invalidDateReviewRows.filter((row) => {
      const value = correctedDates[reviewRowKey(row.sheetName, row.rowNumber)];
      return value ? isValidDateInput(value) : false;
    }).length;
  }, [correctedDates, preview]);
  const pendingInvalidDateCount =
    Math.max((preview?.invalidDateRows ?? 0) - correctedInvalidDateCount, 0);
  const canImport = Boolean(
    preview &&
      preview.importableRows + correctedInvalidDateCount > 0 &&
      !importSummary,
  );

  const applyBulkDateToEmptyRows = () => {
    if (!preview || !isValidDateInput(bulkCorrectedDate)) {
      return;
    }

    setCorrectedDates((current) => {
      const next = { ...current };

      for (const row of preview.invalidDateReviewRows) {
        const key = reviewRowKey(row.sheetName, row.rowNumber);
        if (!next[key]) {
          next[key] = bulkCorrectedDate;
        }
      }

      return next;
    });
  };

  return (
    <section className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-slate-100 pb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
          Tek Seferlik Aktarım
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">
          Eski Faaliyet Aktarımı
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Bu bölüm yalnızca <strong>2018</strong> ve{" "}
          <strong>YENİ FAALİYETT</strong> sheetlerini okur. Ödeme, makbuz,
          stok, kargo veya gelir-gider kaydı oluşturmaz; sadece hasta işlem
          listesine geçmiş faaliyet kaydı ekler.
        </p>
      </div>

      <div
        className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center sm:px-8"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
          <Upload className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-slate-950">
          Eski Excel dosyasını seçin
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Önce preview oluşturulur; preview olmadan import yapılamaz.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isReading || isImporting}
          className={`${panelSecondaryButtonClassName} mt-5 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {isReading ? "Preview hazırlanıyor..." : "Dosya Seç ve Preview Al"}
        </button>
        {fileName ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileSpreadsheet className="size-4 text-slate-500" aria-hidden="true" />
            {fileName}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryBox label="Toplam okunan satır" value={preview.totalRows} />
            <SummaryBox
              label="Aktarılabilir hasta faaliyet"
              value={preview.importableRows}
              tone="green"
            />
            <SummaryBox
              label="Hasta adı boş"
              value={preview.missingPatientRows}
              tone="amber"
            />
            <SummaryBox
              label="Finansal dışlanan"
              value={preview.financialRows}
              tone="red"
            />
            <SummaryBox
              label="Tarih hatalı"
              value={preview.invalidDateRows}
              tone="red"
            />
            <SummaryBox
              label="Tarihi düzeltilen"
              value={correctedInvalidDateCount}
              tone="green"
            />
            <SummaryBox
              label="Düzeltme bekleyen"
              value={pendingInvalidDateCount}
              tone="amber"
            />
            <SummaryBox
              label="İşlem/not boş"
              value={preview.missingContentRows}
              tone="amber"
            />
            <SummaryBox
              label="Duplicate"
              value={preview.duplicateRows}
              tone="blue"
            />
            <SummaryBox label="Sheet" value={preview.sheets.length} />
          </div>

          {preview.invalidDateReviewRows.length > 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 border-b border-amber-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-amber-950">
                    Tarih Hatalı İnceleme Listesi
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                    Bu satırlar tarih alanı hatalı olduğu için otomatik
                    aktarılmaz. Eksiksiz aktarım için tarihleri düzeltip
                    onaylayabilirsiniz.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                      Tüm tarih hatalı satırlar için varsayılan tarih
                    </span>
                    <input
                      type="date"
                      className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                      value={bulkCorrectedDate}
                      onChange={(event) => setBulkCorrectedDate(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={`${panelSecondaryButtonClassName} h-10 border-amber-200 px-4 py-2`}
                    disabled={!isValidDateInput(bulkCorrectedDate)}
                    onClick={applyBulkDateToEmptyRows}
                  >
                    Seçili tarihleri tüm boşlara uygula
                  </button>
                </div>
              </div>

              <div className={`${panelTableScrollClassName} mt-4 bg-white`}>
                <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Sheet
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Satır No
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Ham Tarih
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Hasta Adı
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Gönderen
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Yapılan İşlem
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Not
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Düzeltilmiş Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.invalidDateReviewRows.map((row) => {
                      const key = reviewRowKey(row.sheetName, row.rowNumber);
                      return (
                        <tr key={key} className="text-slate-700">
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.sheetName}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 tabular-nums">
                            {row.rowNumber}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 font-semibold text-rose-700">
                            {row.rawDate || "-"}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">
                            {row.patientName}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.sender ?? "-"}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.operationDescription}
                          </td>
                          <td className="max-w-72 border-b border-slate-100 px-3 py-3">
                            <span className="line-clamp-2">
                              {row.notes ?? "-"}
                            </span>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            <input
                              type="date"
                              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                              value={correctedDates[key] ?? ""}
                              onChange={(event) =>
                                setCorrectedDates((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className={panelTableScrollClassName}>
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-2.5">Sheet adı</th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Toplam okunan
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Aktarılabilir
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Hasta adı boş
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Finansal
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Tarih hatalı
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-right">
                    Duplicate
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.sheets.map((sheet) => (
                  <tr key={sheet.sheetName} className="text-slate-700">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">
                      {sheet.sheetName}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {sheet.totalRows}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right font-semibold tabular-nums text-emerald-700">
                      {sheet.importableRows}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {sheet.missingPatientRows}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {sheet.financialRows}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {sheet.invalidDateRows}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">
                      {sheet.duplicateRows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              İlk 50 aktarılacak örnek satır
            </h3>
            {preview.examples.length > 0 ? (
              <div className={`${panelTableScrollClassName} mt-3`}>
                <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2.5">Sheet</th>
                      <th className="border-b border-slate-200 px-3 py-2.5">Satır</th>
                      <th className="border-b border-slate-200 px-3 py-2.5">Tarih</th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Hasta adı
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Gönderen
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">
                        Yapılan işlem
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2.5">Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.examples.map((row) => (
                      <tr
                        key={`${row.sheetName}-${row.rowNumber}`}
                        className="text-slate-700"
                      >
                        <td className="border-b border-slate-100 px-3 py-3">
                          {row.sheetName}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 tabular-nums">
                          {row.rowNumber}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 whitespace-nowrap">
                          {formatDate(row.transactionDate)}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950">
                          {row.patientName}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          {row.sender ?? "-"}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          {row.operationDescription}
                        </td>
                        <td className="max-w-64 border-b border-slate-100 px-3 py-3">
                          <span className="line-clamp-2">{row.notes ?? "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Aktarılabilir örnek satır yok.
              </p>
            )}
          </div>

          {importSummary ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="mr-2 inline size-4" aria-hidden="true" />
              Toplam preview aktarılabilir:{" "}
              {importSummary.totalPreviewImportableRows}. Import’a gönderilen
              toplam: {importSummary.totalSubmittedRows}. Yeni eklenen:{" "}
              {importSummary.newlyInsertedRows}. Normal aktarılan:{" "}
              {importSummary.normalImportedRows}. Tarihi düzeltilerek eklenen:{" "}
              {importSummary.correctedDateImportedRows}. Duplicate atlanan:{" "}
              {importSummary.duplicateRows}. Tarihi düzeltilmediği için atlanan:{" "}
              {importSummary.uncorrectedInvalidDateRows}. Hata sayısı:{" "}
              {importSummary.failedRows}.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              Import butonu yalnızca bu preview sonrasında aktif olur. Finansal
              kolonlar, stok, kargo, makbuz ve ödeme akışları kullanılmaz.
            </p>
            <button
              type="button"
              disabled={!canImport || isImporting}
              onClick={() => setIsConfirmOpen(true)}
              className={`${panelPrimaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
            >
              {isImporting
                ? "Aktarılıyor..."
                : "Eski Faaliyetleri Hasta İşleme Aktar"}
            </button>
          </div>
        </div>
      ) : null}

      {isConfirmOpen ? (
        <ActionModal
          title="Eski Faaliyet Aktarımı"
          description="Bu işlem yalnızca hasta adı bulunan eski faaliyet kayıtlarını hasta işlem listesine ekler. Ödeme, makbuz, stok veya gelir-gider kaydı oluşturmaz."
          onClose={() => {
            if (!isImporting) setIsConfirmOpen(false);
          }}
          showFooter={false}
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <strong>{preview?.importableRows ?? 0}</strong> normal hasta
              faaliyet kaydı ve <strong>{correctedInvalidDateCount}</strong>{" "}
              tarihi düzeltilmiş kayıt aktarılacak.{" "}
              <strong>{pendingInvalidDateCount}</strong> tarih hatalı satır
              düzeltilmediği için aktarılmayacak. Bu işlem aynı sheet ve satır
              numarasına sahip kayıtları tekrar eklemez.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
                onClick={() => setIsConfirmOpen(false)}
                disabled={isImporting}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={`${panelPrimaryButtonClassName} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70`}
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting
                  ? "Aktarılıyor..."
                  : "Eski Faaliyetleri Hasta İşleme Aktar"}
              </button>
            </div>
          </div>
        </ActionModal>
      ) : null}
    </section>
  );
}

import { FileSpreadsheet, Upload } from "lucide-react";
import { panelPageClassName, panelSecondaryButtonClassName } from "@/components/panel/panel-styles";

const disabledImportNotes = [
  "Stok kayıtları Stok Yönetimi sayfasından manuel yönetilir.",
  "Hasta işlemleri Hasta / İşlem Takibi sayfasından eklenir.",
  "Gelir-gider kayıtları Gelir - Gider Takibi sayfasından eklenir.",
  "Kargo kayıtları Kargo Yönetimi sayfasından eklenir.",
];

export function ImportsWorkspace() {
  return (
    <div className={panelPageClassName}>
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-3xl border border-amber-300 bg-amber-50 px-5 py-5 shadow-sm sm:px-8 sm:py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Teknik Bakım
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-amber-950 sm:text-base">
            Eski faaliyet aktarımı tamamlandı. Bu sayfa yalnızca teknik bakım
            amacıyla kullanılmalıdır.
          </p>
        </section>

        <fieldset
          disabled
          aria-disabled="true"
          className="rounded-3xl border border-slate-200 bg-white p-5 opacity-70 shadow-sm sm:p-8"
        >
          <legend className="sr-only">Eski faaliyet aktarımı (devre dışı)</legend>
          <div className="border-b border-slate-100 pb-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Tek Seferlik Aktarım
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">
              Eski Faaliyet Aktarımı
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Aktarım tamamlandığı için bu bölümdeki kontroller devre dışıdır.
              Yeni veri girişleri paneldeki ilgili modüllerden yapılmalıdır.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center sm:px-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <Upload className="size-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-700">
              Eski Excel dosyası seçimi kapalı
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Preview ve import işlemleri teknik bakım modunda kullanılamaz.
            </p>
            <button
              type="button"
              disabled
              className={`${panelSecondaryButtonClassName} mt-5 cursor-not-allowed opacity-60`}
            >
              Dosya Seç ve Preview Al
            </button>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400">
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Dosya seçilmedi
            </p>
          </div>
        </fieldset>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Panel Bilgilendirmesi
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Excel İçe Aktarım Devre Dışı
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Eski Excel dosyalarındaki tarih, tahsilat, kargo ve işlem verileri
            düzensiz olduğu için otomatik içe aktarım kapatıldı. Verilerin
            doğruluğunu korumak için kayıtlar paneldeki ilgili modüllerden manuel
            girilmelidir.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold leading-6 text-amber-900">
              Excel üzerinden stok, hasta işlem, ödeme, gider, kargo veya
              hatırlatıcı kaydı oluşturulmaz.
            </p>
          </div>

          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
            {disabledImportNotes.map((note) => (
              <li
                key={note}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

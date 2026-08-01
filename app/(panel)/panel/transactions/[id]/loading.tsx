export default function TransactionDetailLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-4 h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-2 h-4 w-1/2 max-w-sm animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5 lg:grid-cols-3 xl:grid-cols-5 lg:px-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[4.5rem] animate-pulse rounded-xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="flex gap-2 pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-50" />
      </section>
      <span className="sr-only">İşlem detayı yükleniyor…</span>
    </div>
  );
}

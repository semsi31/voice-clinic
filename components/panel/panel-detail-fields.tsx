import type { ReactNode } from "react";

export type PanelDetailItem = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

function hasDisplayValue(value: ReactNode) {
  return value !== null && value !== undefined && value !== "";
}

/**
 * Read-only detail sheet: muted label column + value column on sm+,
 * stacked label-over-value on narrow screens. No navy pills / badge chrome.
 */
export function PanelDetailField({
  label,
  value,
  wide = false,
  className = "",
}: Readonly<{
  label: string;
  value: ReactNode;
  wide?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={[
        "detail-row grid grid-cols-1 border-b border-slate-200/90 last:border-b-0 sm:grid-cols-[10.5rem_minmax(0,1fr)]",
        wide ? "sm:col-span-2" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <dt className="bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-500 sm:border-r sm:border-slate-200/90 sm:px-4 sm:py-3.5 sm:text-[13px] sm:leading-6">
        {label}
      </dt>
      <dd className="min-w-0 px-3 py-2.5 text-sm font-semibold leading-6 break-words text-slate-900 sm:px-4 sm:py-3.5">
        {value}
      </dd>
    </div>
  );
}

export function PanelDetailGrid({
  items,
  emptyTitle = "Ek bilgi yok",
  emptyDescription = "Bu bölüm için gösterilecek alan bulunmuyor.",
}: Readonly<{
  items: PanelDetailItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}>) {
  const visibleItems = items.filter((item) => hasDisplayValue(item.value));

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center sm:px-5">
        <p className="text-sm font-bold text-slate-900">{emptyTitle}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <dl className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {visibleItems.map((item) => (
        <PanelDetailField
          key={item.label}
          label={item.label}
          value={item.value}
          wide={item.wide}
        />
      ))}
    </dl>
  );
}

export function PanelDetailStack({
  items,
}: Readonly<{
  items: PanelDetailItem[];
}>) {
  const visibleItems = items.filter((item) => hasDisplayValue(item.value));

  return (
    <dl className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {visibleItems.map((item) => (
        <PanelDetailField
          key={item.label}
          label={item.label}
          value={item.value}
        />
      ))}
    </dl>
  );
}

export function PanelRankedListHeader({
  columns,
}: Readonly<{
  columns: [string, string, string];
}>) {
  return (
    <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_4.5rem_7rem] gap-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:grid sm:px-4">
      <span className="min-w-0">{columns[0]}</span>
      <span className="text-right">{columns[1]}</span>
      <span className="text-right">{columns[2]}</span>
    </div>
  );
}

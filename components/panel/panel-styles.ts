export const panelPageClassName = "space-y-4 sm:space-y-5";

/** Stat / summary cards: 2-up on mobile, 4-up on wide screens. */
export const panelStatGridClassName =
  "grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4";

export const panelFilterLabelClassName =
  "text-xs font-bold uppercase tracking-wide text-slate-500";

export const panelFilterFieldClassName = "grid gap-1.5";

export const panelFilterInputClassName =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export const panelFilterSelectClassName =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export const panelFilterGridClassName =
  "mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4";

export const panelPrimaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071225] px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-[#0f2746] hover:!text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 [&_svg]:shrink-0";

export const panelSecondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 [&_svg]:shrink-0";

export const panelTableScrollClassName =
  "overflow-x-auto rounded-2xl border border-slate-200 [scrollbar-width:thin]";

export const panelTableDesktopClassName = "hidden md:block";

export const panelMobileCardListClassName = "grid gap-3 md:hidden";

/** Zebra striping for mobile stacked cards (nth-child on siblings). */
export const panelMobileCardClassName =
  "rounded-2xl border border-slate-200 p-3.5 shadow-sm odd:bg-white even:bg-slate-50/90 sm:p-4";

export const panelMobileCardLabelClassName =
  "text-[11px] font-bold uppercase tracking-wide text-slate-500";

export const panelMobileCardValueClassName =
  "text-sm font-semibold text-slate-950";

/** Desktop table body row — alternating zebra + hover. */
export const panelTableRowClassName =
  "group text-slate-700 transition odd:bg-white even:bg-[#E8EEF5] hover:bg-sky-50/80";

/** Shared `<th>` look — navy bar so headers never read as data cells. */
export const panelTableHeadClassName =
  "border-b-2 border-[#071225]/20 bg-[#0F2746] px-2.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap sm:px-3 sm:py-3 sm:text-[11px]";

export const panelTableHeadRowClassName = "bg-[#0F2746]";

export const panelTableActionsHeadClassName =
  "border-b-2 border-[#071225]/20 bg-[#0F2746] px-2.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap sm:px-3 sm:py-3 sm:text-[11px] md:sticky md:right-0 md:z-[2] md:shadow-[-8px_0_16px_-12px_rgba(7,18,37,0.35)]";

/** Sticky actions cell follows row zebra via group-odd / group-even. */
export const panelTableActionsCellClassName =
  "border-b border-slate-100 px-3 py-3 text-right align-middle bg-white group-odd:bg-white group-even:bg-[#E8EEF5] group-hover:bg-sky-50/80 md:sticky md:right-0 md:z-[1] md:shadow-[-8px_0_16px_-12px_rgba(15,23,42,0.18)]";

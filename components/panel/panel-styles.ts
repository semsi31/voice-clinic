export const panelPageClassName = "min-w-0 w-full max-w-full space-y-4 sm:space-y-5";

/** Stat / summary cards: 2-up on mobile, 4-up on wide screens. */
export const panelStatGridClassName =
  "grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4";

export const panelFilterLabelClassName =
  "text-xs font-bold uppercase tracking-wide text-slate-500";

export const panelFilterFieldClassName = "grid min-w-0 gap-1.5";

export const panelFilterInputClassName =
  "h-10 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export const panelFilterSelectClassName =
  "h-10 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 pr-8 text-base font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export const panelFilterGridClassName =
  "mb-3 grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4";

export const panelPrimaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071225] px-4 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-[#0f2746] hover:!text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 [&_svg]:shrink-0";

export const panelSecondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 [&_svg]:shrink-0";

/** Table frame — fills rounded corners; never horizontal scroll. */
export const panelTableScrollClassName =
  "w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200";

/** No CSS zoom — zoom left empty gaps inside rounded corners. */
export const panelTableZoomInnerClassName = "w-full min-w-0 max-w-full";

/** Always fills frame width — no sideways growth. */
export const panelTableClassName =
  "w-full max-w-full table-fixed border-separate border-spacing-0 text-left text-[11px] leading-snug";

/** Full text, wraps in cell — no ellipsis, no horizontal overflow. */
export const panelTableCellClassName =
  "min-w-0 break-words [overflow-wrap:anywhere] border-b border-slate-100 px-1.5 py-1.5 align-middle";

/** Status / type chips — keep pill intact. */
export const panelTableBadgeCellClassName =
  "min-w-0 overflow-visible border-b border-slate-100 px-1.5 py-1.5 align-middle";

export const panelTableDesktopClassName = "hidden lg:block";

export const panelMobileCardListClassName = "grid gap-3 lg:hidden";

/** Zebra striping for mobile stacked cards (nth-child on siblings). */
export const panelMobileCardClassName =
  "rounded-2xl border border-slate-200 p-3.5 shadow-sm odd:bg-white even:bg-slate-50/90 sm:p-4";

export const panelMobileCardLabelClassName =
  "text-[11px] font-bold uppercase tracking-wide text-slate-500";

export const panelMobileCardValueClassName =
  "text-sm font-semibold text-slate-950";

/** Desktop table body row — alternating zebra + hover. */
export const panelTableRowClassName =
  "group text-slate-700 transition odd:bg-white even:bg-[#E8EEF5] hover:bg-sky-50/80 last:[&>td:first-child]:rounded-bl-[0.9rem] last:[&>td:last-child]:rounded-br-[0.9rem]";

/**
 * Shared header: equal horizontal padding so gaps between labels look even.
 * Column widths come from colgroup (equal flexible cols).
 */
export const panelTableHeadClassName =
  "min-w-0 break-words border-b-2 border-[#071225]/20 bg-[#0F2746] px-1.5 py-2.5 text-left text-[9px] font-bold uppercase leading-tight tracking-wide text-white first:rounded-tl-[0.9rem]";

export const panelTableHeadRowClassName = "bg-[#0F2746]";

/** Checkbox column — never clip the control; keep clicks working. */
export const panelTableCheckboxCellClassName =
  "relative z-[1] w-9 overflow-visible border-b border-slate-100 px-1.5 py-1.5 align-middle";

/** Checkbox column width helper for colgroup. */
export const panelTableCheckboxColClassName = "w-10";

/** Actions column — fits 3 icon buttons. */
export const panelTableActionsColClassName = "w-[7rem]";

export const panelTableActionsHeadClassName =
  "w-[7rem] rounded-tr-[0.9rem] border-b-2 border-[#071225]/20 bg-[#0F2746] px-1.5 py-2.5 text-right text-[9px] font-bold uppercase leading-tight tracking-wide text-white";

export const panelTableActionsCellClassName =
  "w-[7rem] overflow-visible border-b border-slate-100 px-1.5 py-1.5 text-right align-middle bg-white group-odd:bg-white group-even:bg-[#E8EEF5] group-hover:bg-sky-50/80";

import type { LucideIcon } from "lucide-react";

export type StatCardVariant = "blue" | "green" | "amber" | "red" | "purple";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  variant?: StatCardVariant;
};

const variantClassNames: Record<StatCardVariant, string> = {
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-rose-50 text-rose-700 ring-rose-100",
  purple: "bg-slate-50 text-slate-600 ring-slate-200",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  description,
  variant = "blue",
}: Readonly<StatCardProps>) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-950 sm:mt-3 sm:text-2xl">
            {value}
          </p>
        </div>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset sm:size-10 ${variantClassNames[variant]}`}
        >
          <Icon className="size-4 sm:size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:mt-4 sm:block">
        {description}
      </p>
    </article>
  );
}

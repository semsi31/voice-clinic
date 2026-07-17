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
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${variantClassNames[variant]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
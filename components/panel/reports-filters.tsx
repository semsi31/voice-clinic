import { BarChart3 } from "lucide-react";
import {
  monthOptions,
  type ReportFilter,
} from "@/lib/reports";
import {
  panelFilterLabelClassName,
  panelFilterSelectClassName,
  panelPrimaryButtonClassName,
} from "@/components/panel/panel-styles";

type ReportsFiltersProps = {
  filter: ReportFilter;
  yearOptions: number[];
};

export function ReportsFilters({ filter, yearOptions }: ReportsFiltersProps) {
  return (
    <form
      action="/panel/reports"
      method="get"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]"
    >
      <label className="grid gap-2">
        <span className={panelFilterLabelClassName}>Ay</span>
        <select
          name="month"
          defaultValue={String(filter.month)}
          className={panelFilterSelectClassName}
        >
          {monthOptions.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className={panelFilterLabelClassName}>Yıl</span>
        <select
          name="year"
          defaultValue={String(filter.year)}
          className={panelFilterSelectClassName}
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <button type="submit" className={`${panelPrimaryButtonClassName} w-full`}>
          <BarChart3 className="size-4" aria-hidden="true" />
          Raporu Oluştur
        </button>
      </div>
    </form>
  );
}

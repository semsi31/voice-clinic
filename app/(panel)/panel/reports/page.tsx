import { PanelCard } from "@/components/panel/panel-card";
import { ReportsContent } from "@/components/panel/reports-content";
import { ReportsFilters } from "@/components/panel/reports-filters";
import { panelPageClassName } from "@/components/panel/panel-styles";
import {
  fetchMonthlyReport,
  getDefaultReportFilter,
  getYearOptions,
  parseReportFilter,
} from "@/lib/reports";

type ReportsPageProps = {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseReportFilter(params.month, params.year);
  const report = await fetchMonthlyReport(filter);
  const defaultFilter = getDefaultReportFilter();
  const yearOptions = getYearOptions(defaultFilter.year);

  return (
    <div className={panelPageClassName}>
      <PanelCard title="Rapor Filtreleri">
        <ReportsFilters filter={filter} yearOptions={yearOptions} />
      </PanelCard>

      <ReportsContent report={report} />
    </div>
  );
}

import { DashboardContent } from "@/components/panel/dashboard-content";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { fetchDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div className={panelPageClassName}>
      <DashboardContent data={data} />
    </div>
  );
}

import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CreditCard,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { PanelCard } from "@/components/panel/panel-card";
import { PanelLink } from "@/components/panel/panel-link";
import { StatCard } from "@/components/panel/stat-card";
import { StatusBadge } from "@/components/panel/status-badge";
import type { DashboardData } from "@/lib/dashboard";
import { formatReminderTime } from "@/lib/reminders";
import { formatCurrency, formatDate } from "@/lib/transactions";
import {
  panelSecondaryButtonClassName,
  panelStatGridClassName,
} from "@/components/panel/panel-styles";

const dashboardListItemClassName =
  "flex flex-col gap-3 rounded-2xl border border-slate-200/80 p-3.5 odd:bg-white even:bg-slate-50/90 sm:flex-row sm:items-center sm:justify-between sm:p-4";

const dashboardStackItemClassName =
  "rounded-2xl border border-slate-200/80 p-3.5 odd:bg-white even:bg-slate-50/90 sm:p-4";

type DashboardContentProps = {
  data: DashboardData;
};

function ViewAllLink({ href }: Readonly<{ href: string }>) {
  return (
    <PanelLink href={href} className={`${panelSecondaryButtonClassName} text-sm`}>
      Tümünü Gör
    </PanelLink>
  );
}

function EmptyList({ message }: Readonly<{ message: string }>) {
  return (
    <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-600">
      {message}
    </p>
  );
}

export function DashboardContent({ data }: DashboardContentProps) {
  const { metrics } = data;

  return (
    <>
      <section className={panelStatGridClassName}>
        <StatCard
          icon={CreditCard}
          label="Bugünkü Tahsilat"
          value={formatCurrency(metrics.todayCollections)}
          description={`Bugün ${metrics.todayPaymentCount} ödeme`}
          variant="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Bu Ay Toplam Satış"
          value={formatCurrency(metrics.monthlySales)}
          description="Bu ayki satış hacmi"
          variant="blue"
        />
        <StatCard
          icon={TrendingDown}
          label="Bu Ay Toplam Gider"
          value={formatCurrency(metrics.monthlyExpenses)}
          description="Bu ayki manuel giderler"
          variant="red"
        />
        <StatCard
          icon={WalletCards}
          label="Kalan Toplam Borç"
          value={formatCurrency(metrics.totalOpenDebt)}
          description={`${metrics.openDebtTransactionCount} açık işlem`}
          variant="amber"
        />
        <StatCard
          icon={BellRing}
          label="Bugünkü / Geciken Hatırlatmalar"
          value={String(metrics.todayReminders)}
          description="Bugün veya gecikmiş aktif görevler"
          variant="red"
        />
        <StatCard
          icon={PackageCheck}
          label="Bekleyen Kargolar"
          value={String(metrics.pendingCargoCount)}
          description="Hazırlanan, gönderilen veya sorunlu kayıtlar"
          variant="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Kritik Stok"
          value={String(metrics.criticalStockCount)}
          description="Minimum seviyenin altında ürün"
          variant="amber"
        />
        <StatCard
          icon={BarChart3}
          label="Bu Ay İşlem Sayısı"
          value={String(metrics.monthlyTransactionCount)}
          description="Bu ay oluşturulan işlemler"
          variant="blue"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <PanelCard
          title="Son Hasta İşlemleri"
          action={<ViewAllLink href="/panel/transactions" />}
        >
          {data.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {data.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={dashboardListItemClassName}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-950">
                        {transaction.patientName}
                      </h3>
                      <StatusBadge status={transaction.paymentStatus} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {transaction.operation}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(transaction.date)}
                      {transaction.remainingDebt > 0
                        ? ` • Kalan: ${formatCurrency(transaction.remainingDebt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-950">
                      {formatCurrency(transaction.saleAmount)}
                    </p>
                    <PanelLink
                      href={`/panel/transactions/${transaction.id}`}
                      className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:text-sky-800"
                    >
                      Detaya git
                    </PanelLink>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyList message="Henüz işlem kaydı bulunmuyor." />
          )}
        </PanelCard>

        <PanelCard
          title="Bugünkü / Geciken Hatırlatmalar"
          action={<ViewAllLink href="/panel/reminders" />}
        >
          {data.reminders.length > 0 ? (
            <div className="space-y-3">
              {data.reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={
                    reminder.isOverdue
                      ? "rounded-2xl border border-rose-100 bg-rose-50/70 p-4"
                      : dashboardStackItemClassName
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-950">
                        {reminder.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {reminder.patientName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(reminder.date)}
                        {reminder.time
                          ? ` • ${formatReminderTime(reminder.time)}`
                          : ""}
                        {reminder.isOverdue ? " • Gecikmiş" : ""}
                      </p>
                    </div>
                    <StatusBadge status={reminder.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyList message="Bugün veya gecikmiş aktif hatırlatıcı yok." />
          )}
        </PanelCard>

        <PanelCard
          title="Kritik Stoklar"
          action={<ViewAllLink href="/panel/stock" />}
        >
          {data.criticalStock.length > 0 ? (
            <div className="space-y-3">
              {data.criticalStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 odd:bg-amber-50/50 even:bg-amber-50/90"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Mevcut: {product.quantity} • Minimum: {product.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyList message="Kritik stok seviyesinde ürün bulunmuyor." />
          )}
        </PanelCard>

        <PanelCard
          title="Bekleyen Kargolar"
          action={<ViewAllLink href="/panel/cargo" />}
        >
          {data.pendingCargo.length > 0 ? (
            <div className="space-y-3">
              {data.pendingCargo.map((cargo) => (
                <div
                  key={cargo.id}
                  className={dashboardStackItemClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-950">
                        {cargo.senderName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {cargo.cargoCompany}
                      </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {cargo.trackingNumber || "Takip no yok"}
                  </p>
                </div>
                <StatusBadge status={cargo.status} />
              </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyList message="Bekleyen kargo kaydı bulunmuyor." />
          )}
        </PanelCard>
      </section>
    </>
  );
}

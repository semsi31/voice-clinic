import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CreditCard,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { PanelCard } from "@/components/panel/panel-card";
import { ReportsPaymentChart } from "@/components/panel/reports-payment-chart";
import { StatCard } from "@/components/panel/stat-card";
import type { MonthlyReportData } from "@/lib/reports";
import { formatCurrency } from "@/lib/transactions";

type ReportsContentProps = {
  report: MonthlyReportData;
};

export function ReportsContent({ report }: ReportsContentProps) {
  const hasPaymentData = report.paymentMethodChart.some((item) => item.value > 0);

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Toplam Satış"
          value={formatCurrency(report.totalSales)}
          description="Satış hacmi, net gelire dahil edilmez"
          variant="blue"
        />
        <StatCard
          icon={CreditCard}
          label="Toplam Tahsilat"
          value={formatCurrency(report.totalCollections)}
          description="Seçili dönem tahsilatları"
          variant="green"
        />
        <StatCard
          icon={Banknote}
          label="Manuel Gelir"
          value={formatCurrency(report.manualIncome)}
          description="Seçili dönem manuel gelir kayıtları"
          variant="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Toplam Gider"
          value={formatCurrency(report.totalExpenses)}
          description="Manuel gider kayıtları"
          variant="red"
        />
        <StatCard
          icon={WalletCards}
          label="Net Durum"
          value={formatCurrency(report.netBalance)}
          description="Tahsilat + manuel gelir - gider"
          variant="purple"
        />
        <StatCard
          icon={ReceiptText}
          label="Toplam Açık Borç"
          value={formatCurrency(report.totalOpenDebt)}
          description="Seçili dönemde açılmış normal işlemlerin güncel kalan borcu"
          variant="amber"
        />
        <StatCard
          icon={BarChart3}
          label="Toplam İşlem Sayısı"
          value={String(report.transactionCount)}
          description="Seçili dönem işlem adedi"
          variant="blue"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <PanelCard
          title="Ödeme Yöntemi Dağılımı"
          description="Seçili dönem tahsilat dağılımı."
        >
          {hasPaymentData ? (
            <ReportsPaymentChart data={report.paymentMethodChart} />
          ) : (
            <EmptySection message="Seçili dönemde tahsilat kaydı bulunamadı." />
          )}
        </PanelCard>

        <PanelCard
          title="En Çok Yapılan İşlemler"
          description="Seçili dönemde en sık kayıt edilen işlemler."
        >
          {report.topOperations.length > 0 ? (
            <div className="space-y-3">
              {report.topOperations.map((operation) => (
                <div
                  key={operation.name}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {operation.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {operation.count} işlem
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-slate-950">
                    {formatCurrency(operation.totalSales)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection message="Seçili dönemde işlem kaydı bulunamadı." />
          )}
        </PanelCard>
      </section>

      <PanelCard
        title="Kritik Stoklar"
        description="Minimum stok seviyesinin altında veya eşit ürünler."
      >
        {report.criticalStock.length > 0 ? (
          <div className="space-y-3">
            {report.criticalStock.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-950">
                    {product.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Kalan: {product.quantity} • Minimum: {product.minStock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection message="Kritik stok seviyesinde ürün bulunmuyor." />
        )}
      </PanelCard>
    </>
  );
}

function EmptySection({ message }: Readonly<{ message: string }>) {
  return (
    <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-600">
      {message}
    </p>
  );
}

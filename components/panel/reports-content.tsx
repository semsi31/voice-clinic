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
import { PanelRankedListHeader } from "@/components/panel/panel-detail-fields";
import { ReportsPaymentChart } from "@/components/panel/reports-payment-chart";
import { panelStatGridClassName } from "@/components/panel/panel-styles";
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
      <section className={panelStatGridClassName}>
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
          description="Seçili dönem tahsilatları ve manuel gelirler."
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
            <div>
              <PanelRankedListHeader columns={["İşlem", "Adet", "Tutar"]} />
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {report.topOperations.map((operation, index) => (
                  <div
                    key={operation.name}
                    className={`border-b border-slate-200/80 px-3 py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem] sm:items-center sm:gap-3 sm:px-4 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/90"
                    }`}
                  >
                    <p className="min-w-0 truncate font-semibold text-slate-950">
                      {operation.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3 sm:mt-0 sm:contents">
                      <p className="text-sm text-slate-600 sm:text-right sm:font-semibold sm:tabular-nums">
                        <span className="sm:hidden">{operation.count} işlem</span>
                        <span className="hidden sm:inline">{operation.count}</span>
                      </p>
                      <p className="font-bold tabular-nums text-slate-950 sm:text-right">
                        {formatCurrency(operation.totalSales)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="overflow-hidden rounded-2xl border border-amber-200">
            {report.criticalStock.map((product, index) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 border-b border-amber-100 px-4 py-3 last:border-b-0 ${
                  index % 2 === 0 ? "bg-amber-50/50" : "bg-amber-50/90"
                }`}
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

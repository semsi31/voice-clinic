export type PanelStatus =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "cancelled"
  | "delayed"
  | "prepared"
  | "sent"
  | "shipped"
  | "delivered"
  | "returned"
  | "problematic"
  | "problem"
  | "paid"
  | "partial"
  | "unpaid"
  | "normal"
  | "low_stock"
  | "out_of_stock"
  | "failed"
  | "new"
  | "contacted";

type StatusBadgeProps = {
  status: PanelStatus;
};

const statusConfig: Record<PanelStatus, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  inactive: {
    label: "Pasif",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  pending: {
    label: "Bekliyor",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Tamamlandı",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "İptal",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  delayed: {
    label: "Ertelendi",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  prepared: {
    label: "Hazırlandı",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  sent: {
    label: "Gönderildi",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  shipped: {
    label: "Gönderildi",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  delivered: {
    label: "Teslim Edildi",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  returned: {
    label: "İade Edildi",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  problematic: {
    label: "Sorunlu",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  problem: {
    label: "Sorunlu",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  paid: {
    label: "Ödendi",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  partial: {
    label: "Kısmi Ödeme",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unpaid: {
    label: "Ödenmedi",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  low_stock: {
    label: "Kritik Stok",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  normal: {
    label: "Normal",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  out_of_stock: {
    label: "Tükendi",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  failed: {
    label: "Hatalı",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  new: {
    label: "Yeni",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  contacted: {
    label: "Görüşüldü",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

export function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] leading-none font-bold ${config.className}`}
      title={config.label}
    >
      {config.label}
    </span>
  );
}

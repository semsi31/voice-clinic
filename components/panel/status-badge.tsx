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
  /** Shorter payment labels for dense table cells. */
  compact?: boolean;
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

const paymentStatusCompactLabels: Partial<Record<PanelStatus, string>> = {
  paid: "Ödendi",
  partial: "Kısmi",
  unpaid: "Bekliyor",
};

export function StatusBadge({
  status,
  compact = false,
}: Readonly<StatusBadgeProps>) {
  const config = statusConfig[status];
  const label =
    (compact && paymentStatusCompactLabels[status]) || config.label;

  return (
    <span
      className={`inline-flex w-fit max-w-none items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] leading-none font-bold min-[1440px]:px-2.5 min-[1440px]:py-1 min-[1440px]:text-[11px] ${config.className}`}
      title={config.label}
    >
      {label}
    </span>
  );
}

type DeviceDeliveryBadgeProps = {
  status: "pending" | "delivered";
  /** Compact labels for dense laptop table cells. */
  compact?: boolean;
};

const deviceDeliveryConfig: Record<
  DeviceDeliveryBadgeProps["status"],
  {
    label: string;
    shortLabel: string;
    className: string;
    dotClassName: string;
  }
> = {
  pending: {
    label: "Teslim Edilmedi",
    shortLabel: "Bekliyor",
    className: "border-[#f5d9a8] bg-[#fff6e8] text-[#8a5a00]",
    dotClassName: "bg-[#e6a23c]",
  },
  delivered: {
    label: "Teslim Edildi",
    shortLabel: "Teslim",
    className: "border-[#b6e3c8] bg-[#eefbf3] text-[#0f6b3c]",
    dotClassName: "bg-[#22a06b]",
  },
};

export function DeviceDeliveryBadge({
  status,
  compact = false,
}: Readonly<DeviceDeliveryBadgeProps>) {
  const config = deviceDeliveryConfig[status] ?? deviceDeliveryConfig.pending;
  const label = compact ? config.shortLabel : config.label;

  return (
    <span
      className={`inline-flex w-fit max-w-none items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] leading-none font-bold min-[1440px]:gap-1.5 min-[1440px]:px-2.5 min-[1440px]:py-1 min-[1440px]:text-[11px] ${config.className}`}
      title={config.label}
      aria-label={config.label}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${config.dotClassName}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

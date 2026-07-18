import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  Boxes,
  FileText,
  Home,
  Inbox,
  PackageCheck,
  ReceiptText,
  WalletCards,
} from "lucide-react";

export type PanelNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const panelNavigation: PanelNavigationItem[] = [
  { title: "Ana Sayfa", href: "/panel/dashboard", icon: Home },
  { title: "Hasta / İşlem Takibi", href: "/panel/transactions", icon: ReceiptText },
  { title: "Gelir - Gider Takibi", href: "/panel/income-expense", icon: WalletCards },
  { title: "Kargo Yönetimi", href: "/panel/cargo", icon: PackageCheck },
  { title: "Stok Yönetimi", href: "/panel/stock", icon: Boxes },
  { title: "Hazır Belgeler", href: "/panel/documents", icon: FileText },
  { title: "Hatırlatıcılar", href: "/panel/reminders", icon: BellRing },
  { title: "Raporlar", href: "/panel/reports", icon: BarChart3 },
  { title: "Talepler", href: "/panel/requests", icon: Inbox },
];

/** Resolves the current panel nav item from a pathname (longest href match wins). */
export function getActivePanelNavItem(pathname: string): PanelNavigationItem | null {
  const matches = panelNavigation.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  );
}

import {
  AlertTriangle,
  Boxes,
  PackageX,
  TrendingUp,
} from "lucide-react";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { StatCard } from "@/components/panel/stat-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { StockProductsTable } from "@/components/panel/stock-products-table";
import type { StockProductRecord } from "@/lib/stock";

async function getStockData(): Promise<{
  products: StockProductRecord[];
  monthlyMovementCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return { products: [], monthlyMovementCount: 0 };
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("stock_products")
    .select("*")
    .order("created_at", { ascending: false });

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { count } = await supabase
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .gte("movement_date", firstDayOfMonth);

  return {
    products: (products ?? []) as StockProductRecord[],
    monthlyMovementCount: count ?? 0,
  };
}

export default async function StockPage() {
  const { products, monthlyMovementCount } = await getStockData();
  const lowStockCount = products.filter(
    (product) => product.status === "low_stock",
  ).length;
  const outOfStockCount = products.filter(
    (product) => product.status === "out_of_stock",
  ).length;

  return (
    <div className={panelPageClassName}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Toplam Ürün"
          value={String(products.length)}
          description="Kayıtlı stok kalemi"
          variant="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Kritik Stok"
          value={String(lowStockCount)}
          description="Minimum seviyenin altında"
          variant="amber"
        />
        <StatCard
          icon={PackageX}
          label="Tükenen Ürün"
          value={String(outOfStockCount)}
          description="Stokta kalmayan ürünler"
          variant="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Bu Ay Stok Hareketi"
          value={String(monthlyMovementCount)}
          description="Giriş, çıkış ve transfer kayıtları"
          variant="purple"
        />
      </section>

      <StockProductsTable products={products} />
    </div>
  );
}

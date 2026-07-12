import { NewTransactionForm } from "@/components/panel/new-transaction-form";
import { panelPageClassName } from "@/components/panel/panel-styles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { StockProductRecord } from "@/lib/stock";

async function getAvailableStockProducts() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_products")
    .select("*")
    .gt("quantity", 0)
    .order("name", { ascending: true });

  return (data ?? []) as StockProductRecord[];
}

export default async function NewTransactionPage() {
  const stockProducts = await getAvailableStockProducts();

  return (
    <div className={panelPageClassName}>
      <NewTransactionForm stockProducts={stockProducts} />
    </div>
  );
}
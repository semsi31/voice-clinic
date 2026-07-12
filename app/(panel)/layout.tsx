import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/panel-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured()) {
    // .env.local henüz oluşturulmadıysa panel mock veriyle önceki gibi
    // çalışır; auth altyapısı gerçek Supabase bilgileri girilince devreye girer.
    return (
      <PanelShell userName="Admin" userEmail="">
        {children}
      </PanelShell>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // is_active = false olan kullanıcı panel erişiminden çıkarılır.
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const userName = profile?.full_name || user.email || "Admin";
  const userEmail = user.email ?? "";

  return (
    <PanelShell userName={userName} userEmail={userEmail}>
      {children}
    </PanelShell>
  );
}

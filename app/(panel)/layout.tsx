import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/panel-shell";
import {
  allowUnauthenticatedPanelMock,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Local mock only. Production without Supabase env must never open the panel.
  if (!isSupabaseConfigured()) {
    if (allowUnauthenticatedPanelMock()) {
      return (
        <PanelShell userName="Admin" userEmail="">
          {children}
        </PanelShell>
      );
    }

    redirect("/login?error=config");
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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(
        "Inactive user signOut failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
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

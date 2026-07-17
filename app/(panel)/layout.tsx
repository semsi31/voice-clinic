import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/panel-shell";
import { getActivePanelUser } from "@/lib/panel-auth";
import {
  allowUnauthenticatedPanelMock,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

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

  const auth = await getActivePanelUser();

  if (!auth) {
    redirect("/login");
  }

  const { user, profile } = auth;

  const userName = profile.full_name || user.email || "Admin";
  const userEmail = user.email ?? "";

  return (
    <PanelShell userName={userName} userEmail={userEmail}>
      {children}
    </PanelShell>
  );
}

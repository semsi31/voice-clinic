import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/panel-shell";
import { getActivePanelUser } from "@/lib/panel-auth";
import { getPanelDisplayName, getPanelGreeting } from "@/lib/panel-display";
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
        <PanelShell userGreeting="Merhaba Admin, iyi günler dileriz." userName="Admin" userEmail="">
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

  const userName = getPanelDisplayName(profile.full_name, user.email);
  const userEmail = user.email ?? "";
  const userGreeting = getPanelGreeting(profile.full_name, user.email);

  return (
    <PanelShell
      userGreeting={userGreeting}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </PanelShell>
  );
}

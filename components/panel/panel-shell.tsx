"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { PanelTopbar } from "@/components/panel/panel-topbar";

type PanelShellProps = {
  children: ReactNode;
  userGreeting: string;
  userTopbarGreeting: string;
  userName: string;
  userEmail: string;
};

export function PanelShell({
  children,
  userGreeting,
  userTopbarGreeting,
  userName,
  userEmail,
}: Readonly<PanelShellProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col bg-slate-100 text-slate-950">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:block">
        <PanelSidebar />
      </div>

      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Panel menüsü"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            aria-label="Panel menüsünü kapat"
            onClick={closeMobileMenu}
          />
          <div className="relative flex h-dvh max-h-dvh w-[min(100%,18rem)] flex-col bg-white shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm"
              onClick={closeMobileMenu}
              aria-label="Panel menüsünü kapat"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PanelSidebar onNavigate={closeMobileMenu} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 w-full max-w-full flex-1 flex-col lg:pl-72">
        <PanelTopbar
          onMenuClick={() => setIsMobileMenuOpen(true)}
          userGreeting={userGreeting}
          userTopbarGreeting={userTopbarGreeting}
          userName={userName}
          userEmail={userEmail}
        />
        <main className="min-w-0 w-full max-w-full flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-5 lg:py-6 xl:px-8">
          <div className="mx-auto min-w-0 w-full max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

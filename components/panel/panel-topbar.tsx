"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, UserCircle } from "lucide-react";
import { signOut } from "@/lib/supabase/actions";

type PanelTopbarProps = {
  onMenuClick: () => void;
  userName: string;
  userEmail: string;
};

export function PanelTopbar({
  onMenuClick,
  userName,
  userEmail,
}: PanelTopbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          onClick={onMenuClick}
          aria-label="Panel menüsünü aç"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Voice Klinik
          </p>
          <h1 className="truncate text-base font-bold text-slate-950 lg:text-lg">
            Yönetim Paneli
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <UserCircle className="size-5" aria-hidden="true" />
              </span>
              <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
                Merhaba, {userName}
              </span>
              <ChevronDown
                className="hidden size-4 text-slate-400 sm:inline"
                aria-hidden="true"
              />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {userName}
                  </p>
                  {userEmail ? (
                    <p className="truncate text-xs text-slate-500">
                      {userEmail}
                    </p>
                  ) : null}
                </div>
                <div className="my-1 border-t border-slate-100" />
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Çıkış Yap
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLink } from "@/components/panel/panel-link";
import { panelNavigation } from "@/components/panel/panel-navigation";
import { cdnImageSrc } from "@/lib/cdn-image";

const LOGO_SRC = cdnImageSrc("/images/voice-logo.png");

type PanelSidebarProps = {
  onNavigate?: () => void;
};

export function PanelSidebar({ onNavigate }: PanelSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-[#071225] text-white lg:min-h-screen">
      <div className="border-b border-white/10 px-6 py-6">
        <PanelLink
          href="/panel/dashboard"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Image
              src={LOGO_SRC}
              alt="Voice Klinik"
              width={645}
              height={823}
              unoptimized
              className="h-8 w-auto object-contain"
            />
          </span>
          <span>
            <span className="block text-base font-bold">Voice Klinik</span>
            <span className="block text-xs text-slate-300">Yönetim Paneli</span>
          </span>
        </PanelLink>
      </div>

      <nav className="space-y-1.5 px-4 py-5" aria-label="Panel menüsü">
        {panelNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const linkClassName = [
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isActive
              ? "bg-[#C49A3A] text-white shadow-md shadow-black/20 ring-1 ring-inset ring-white/15"
              : "text-slate-300 hover:bg-white/10 hover:text-white",
          ].join(" ");

          return (
            <PanelLink
              key={item.href}
              href={item.href}
              className={linkClassName}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={[
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-xl",
                  isActive ? "bg-white/15 text-white" : "bg-white/5 text-slate-300",
                ].join(" ")}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 leading-5">{item.title}</span>
              {isActive ? (
                <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Aktif
                </span>
              ) : null}
            </PanelLink>
          );
        })}
      </nav>
    </aside>
  );
}
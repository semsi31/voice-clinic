"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { panelNavigation } from "@/components/panel/panel-navigation";

type PanelSidebarProps = {
  onNavigate?: () => void;
};

export function PanelSidebar({ onNavigate }: PanelSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-[#071225] text-white lg:min-h-screen">
      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href="/panel/dashboard"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Image
              src="/images/voice-logo.png"
              alt="Voice Klinik"
              width={645}
              height={823}
              className="h-8 w-auto object-contain"
            />
          </span>
          <span>
            <span className="block text-base font-bold">Voice Klinik</span>
            <span className="block text-xs text-slate-300">Yönetim Paneli</span>
          </span>
        </Link>
      </div>

      <nav className="space-y-1 px-4 py-5" aria-label="Panel menüsü">
        {panelNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const linkClassName = [
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isActive
              ? "bg-[#132743] text-white ring-1 ring-inset ring-white/10"
              : "text-slate-300 hover:bg-white/10 hover:text-white",
          ].join(" ");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClassName}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="leading-5">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
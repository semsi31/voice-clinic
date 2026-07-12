"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MobileSiteMenu } from "@/components/site/mobile-site-menu";
import {
  siteAppointmentLink,
  sitePrimaryNavigation,
  siteSocialLinks,
} from "@/components/site/site-navigation";
import { cn } from "@/lib/utils";

const socialIconMap = {
  Instagram: FaInstagram,
  WhatsApp: FaWhatsapp,
  Facebook: FaFacebookF,
} as const;

function isNavigationItemActive(
  pathname: string,
  href: string,
  children?: { href: string }[],
) {
  return (
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`)) ||
    children?.some((child) => pathname.startsWith(child.href))
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 lg:top-3 lg:px-4 lg:py-2 lg:px-8">
      <div className="mx-auto flex min-h-[3.25rem] w-full items-center justify-between gap-2 rounded-2xl border border-[#eadfca]/80 bg-white px-3 py-2 shadow-[0_10px_36px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:min-h-14 sm:gap-3 sm:rounded-[1.75rem] sm:px-4 lg:max-w-7xl lg:justify-start lg:gap-4 lg:rounded-full lg:border-white/50 lg:px-5 lg:shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:shrink-0">
          <Link
            href="/"
            className="site-logo-motion relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-white shadow-sm shadow-[#D4AF37]/10 sm:size-11 lg:rounded-2xl lg:size-12"
            aria-label="Ana sayfa"
          >
            <Image
              src="/images/voice-logo.png"
              alt="Voice Klinik İşitme Merkezi"
              width={645}
              height={823}
              priority
              className="h-8 w-auto object-contain sm:h-9 lg:h-10"
            />
          </Link>

          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-bold leading-tight text-[#071225] sm:text-[15px]">
              Voice Klinik
            </p>
            <p className="truncate text-[11px] leading-snug text-[#5d6675] sm:text-xs">
              İşitme sağlığı merkezi
            </p>
          </div>
        </div>

        <nav
          className="relative z-10 hidden min-w-0 items-center justify-center gap-1 lg:ml-2 lg:flex xl:ml-3"
          aria-label="Site menüsü"
        >
          {sitePrimaryNavigation.map((item) => {
            const isActive = isNavigationItemActive(
              pathname,
              item.href,
              item.children,
            );

            return (
              <Link
                key={`${item.title}-${item.href}`}
                href={item.href}
                className={cn(
                  "site-nav-link-motion inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-semibold leading-none text-[#071225] hover:bg-white/70 hover:text-[#B88A28] xl:px-3 xl:text-[13px]",
                  isActive &&
                    "bg-white/78 text-[#B88A28] shadow-sm shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/25",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden items-center gap-1.5 xl:flex">
            {siteSocialLinks.map((item) => {
              const Icon = socialIconMap[item.title as keyof typeof socialIconMap];

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={item.title}
                  className="site-social-motion inline-flex size-9 items-center justify-center rounded-full border border-white/60 bg-white/65 text-lg text-[#071225] shadow-sm shadow-slate-950/5 backdrop-blur hover:border-[#C49A3A]/70 hover:bg-[#C49A3A] hover:text-[#071225] hover:shadow-[#C49A3A]/20"
                >
                  <Icon aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          <span className="hidden h-6 w-px bg-[#D4AF37]/30 xl:block" aria-hidden="true" />
          {siteAppointmentLink ? (
            <Link
              href={siteAppointmentLink.href}
              className="site-btn-motion hidden min-h-10 items-center justify-center whitespace-nowrap rounded-md bg-[#C49A3A] px-4 text-xs font-bold uppercase leading-none tracking-[0.04em] text-white shadow-lg shadow-[#C49A3A]/25 hover:bg-[#B88A28] hover:shadow-[#C49A3A]/40 lg:inline-flex"
            >
              {siteAppointmentLink.title}
            </Link>
          ) : null}
          <MobileSiteMenu />
        </div>
      </div>
    </header>
  );
}

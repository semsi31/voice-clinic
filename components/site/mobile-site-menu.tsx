"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SiteIcon } from "@/components/site/site-icon";
import {
  siteAppointmentLink,
  sitePrimaryNavigation,
  siteSocialLinks,
} from "@/components/site/site-navigation";
import { MOBILE_MENU_CLOSE_MS } from "@/lib/site-motion";
import { cdnImageSrc } from "@/lib/cdn-image";
import { cn } from "@/lib/utils";

const LOGO_SRC = cdnImageSrc("/images/voice-logo.png");

const PHONE_DISPLAY = "0 532 217 31 58";
const PHONE_HREF = "tel:+905322173158";
const WHATSAPP_HREF =
  siteSocialLinks.find((item) => item.title === "WhatsApp")?.href ??
  "https://wa.me/905322173158";

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

export function MobileSiteMenu() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  );
  const closeTimerRef = useRef<number | null>(null);
  const pathname = usePathname();

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setIsClosing(false);
    setIsMounted(true);
    window.requestAnimationFrame(() => {
      setIsOpen(true);
    });
  };

  const closeMenu = () => {
    if (!isMounted || isClosing) {
      return;
    }

    setIsOpen(false);
    setIsClosing(true);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, MOBILE_MENU_CLOSE_MS);
  };

  const toggleMenu = () => {
    if (isOpen && !isClosing) {
      closeMenu();
      return;
    }

    if (!isOpen && !isClosing) {
      openMenu();
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (isMounted && isOpen && !isClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted, isOpen, isClosing]);

  useEffect(() => {
    if (!isMounted || !isOpen || isClosing) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // closeMenu identity is stable enough for Escape handling while the drawer is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, isOpen, isClosing]);

  const menuDrawer =
    isMounted && portalTarget
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] lg:hidden"
            role="presentation"
          >
            <button
              type="button"
              className={cn(
                "site-menu-backdrop absolute inset-0 bg-[#071225]/55 backdrop-blur-[3px] transition-opacity duration-300",
                isOpen && !isClosing ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-label="Menüyü kapat"
              onClick={closeMenu}
            />

            <nav
              id="mobile-site-menu"
              className={cn(
                "site-menu-drawer absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(88vw,380px)] flex-col border-l border-[#D4AF37]/25 bg-[#fffdf8] shadow-[-8px_0_28px_rgba(7,18,37,0.12)]",
                isOpen && !isClosing && "site-menu-drawer--open",
                isClosing && "site-menu-drawer--closing",
              )}
              aria-label="Mobil site menüsü"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eadfca] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/30 bg-white shadow-sm">
                    <Image
                      src={LOGO_SRC}
                      alt=""
                      aria-hidden="true"
                      width={645}
                      height={823}
                      unoptimized
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold leading-tight text-[#071225]">
                      Voice Klinik
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B88A28]">
                      Menü
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#eadfca] bg-white text-[#071225] shadow-sm transition-colors hover:bg-[#f7f2e7] active:bg-[#f0e8d8]"
                  aria-label="Menüyü kapat"
                  onClick={closeMenu}
                >
                  <SiteIcon name="close" className="size-5" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3.5 pb-2 pt-2.5">
                <div className="flex flex-col gap-0.5">
                  {sitePrimaryNavigation.map((item, index) => {
                    const isActive = isNavigationItemActive(
                      pathname,
                      item.href,
                      item.children,
                    );

                    return (
                      <div
                        key={`${item.title}-${item.href}`}
                        style={
                          {
                            "--menu-item-index": index,
                          } as CSSProperties
                        }
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            "site-menu-item flex min-h-11 items-center rounded-lg border-l-[3px] border-transparent px-3.5 py-2 text-[15px] font-semibold tracking-[-0.01em] text-[#071225] transition-colors",
                            isActive
                              ? "border-l-[#C49A3A] bg-[#C49A3A]/12 font-bold text-[#071225] hover:bg-[#C49A3A]/16"
                              : "hover:bg-slate-900/[0.035] active:bg-slate-900/[0.05]",
                          )}
                          onClick={closeMenu}
                        >
                          {item.title}
                        </Link>

                        {item.children?.length ? (
                          <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-[#D4AF37]/25 pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "site-menu-item flex min-h-10 items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-[#071225]/75 transition-colors",
                                  pathname.startsWith(child.href)
                                    ? "bg-[#C49A3A]/10 font-semibold text-[#071225]"
                                    : "hover:bg-slate-900/[0.035] active:bg-slate-900/[0.05]",
                                )}
                                onClick={closeMenu}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 px-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B88A28]">
                    Hızlı İletişim
                  </p>
                  <div className="mt-2">
                    <a
                      href={PHONE_HREF}
                      className="flex min-h-10 items-center gap-2.5 text-sm font-medium text-[#071225] transition-colors hover:text-[#B88A28] active:text-[#B88A28]"
                      onClick={closeMenu}
                    >
                      <SiteIcon name="phone" className="size-4 shrink-0 text-[#C49A3A]" />
                      <span className="whitespace-nowrap tracking-wide">
                        {PHONE_DISPLAY}
                      </span>
                    </a>
                    <div className="my-0.5 border-t border-[#eadfca]/70" />
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-10 items-center gap-2.5 text-sm font-medium text-[#071225] transition-colors hover:text-[#B88A28] active:text-[#B88A28]"
                      onClick={closeMenu}
                    >
                      <FaWhatsapp
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#25D366]"
                      />
                      <span>WhatsApp ile Yazın</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-[#d6c7a8] bg-[#fffdf8] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[#5d6675]">
                  <Link
                    href="/kvkk-gizlilik"
                    className="transition-colors hover:text-[#071225]"
                    onClick={closeMenu}
                  >
                    KVKK ve Gizlilik
                  </Link>
                  <span aria-hidden="true" className="text-[#d6c7a8]">
                    ·
                  </span>
                  <Link
                    href="/cerez-politikasi"
                    className="transition-colors hover:text-[#071225]"
                    onClick={closeMenu}
                  >
                    Çerez Politikası
                  </Link>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {siteSocialLinks.map((item) => {
                    const Icon =
                      socialIconMap[item.title as keyof typeof socialIconMap];

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        target={
                          item.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          item.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        aria-label={item.title}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-base text-[#071225] shadow-sm transition-colors hover:border-[#C49A3A]/55 hover:bg-[#C49A3A]/10 hover:text-[#071225] active:bg-[#C49A3A]/15"
                        onClick={closeMenu}
                      >
                        <Icon aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[#5d6675]">
                  <SiteIcon name="clock" className="size-3.5 shrink-0 text-[#C49A3A]" />
                  <span>Pzt–Cum 09:00–18:00</span>
                </p>

                {siteAppointmentLink ? (
                  <Link
                    href={siteAppointmentLink.href}
                    className="site-btn-motion mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C49A3A] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(196,154,58,0.28)] hover:bg-[#B88A28] active:bg-[#A67B22]"
                    onClick={closeMenu}
                  >
                    <SiteIcon name="calendar" className="size-4" />
                    {siteAppointmentLink.title}
                  </Link>
                ) : null}
              </div>
            </nav>
          </div>,
          portalTarget,
        )
      : null;

  return (
    <div key={pathname} className="lg:hidden">
      <button
        type="button"
        className="site-menu-toggle-motion inline-flex size-11 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#071225] shadow-sm hover:border-[#D4AF37]/45 hover:text-[#B88A28]"
        aria-expanded={isOpen}
        aria-controls="mobile-site-menu"
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        onClick={toggleMenu}
      >
        <SiteIcon name={isOpen ? "close" : "menu"} className="size-5" />
      </button>

      {menuDrawer}
    </div>
  );
}

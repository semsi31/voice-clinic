"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
                "site-menu-drawer absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(100%,20.5rem)] max-w-[min(85vw,20.5rem)] flex-col border-l border-[#D4AF37]/20 bg-[#fffdf8] shadow-[-12px_0_40px_rgba(7,18,37,0.18)]",
                isOpen && !isClosing && "site-menu-drawer--open",
                isClosing && "site-menu-drawer--closing",
              )}
              aria-label="Mobil site menüsü"
            >
              <div className="flex items-center justify-between border-b border-[#eadfca] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-white shadow-sm">
                    <Image
                      src={LOGO_SRC}
                      alt=""
                      aria-hidden="true"
                      width={645}
                      height={823}
                      unoptimized
                      className="h-7 w-auto object-contain"
                    />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88A28]">
                      Voice Klinik
                    </p>
                    <p className="text-sm font-bold text-[#071225]">Menü</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-xl border border-[#eadfca] bg-white text-[#071225] shadow-sm hover:bg-[#f7f2e7]"
                  aria-label="Menüyü kapat"
                  onClick={closeMenu}
                >
                  <SiteIcon name="close" className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                <div className="flex flex-col gap-0.5">
                  {sitePrimaryNavigation.map((item) => {
                    const isActive = isNavigationItemActive(
                      pathname,
                      item.href,
                      item.children,
                    );

                    return (
                      <div key={`${item.title}-${item.href}`}>
                        <Link
                          href={item.href}
                          className={cn(
                            "site-menu-item flex min-h-11 items-center rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#071225] transition-colors hover:bg-[#f7f2e7] hover:text-[#B88A28]",
                            isActive &&
                              "bg-[#C49A3A] text-white shadow-md shadow-[#C49A3A]/25 hover:bg-[#B88A28] hover:text-white",
                          )}
                          onClick={closeMenu}
                        >
                          {item.title}
                        </Link>

                        {item.children?.length ? (
                          <div className="mb-2 ml-3 flex flex-col gap-0.5 border-l-2 border-[#D4AF37]/25 pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "site-menu-item flex min-h-11 items-center rounded-lg px-2 py-2 text-sm font-medium text-[#071225]/75 transition-colors hover:bg-[#f7f2e7] hover:text-[#B88A28]",
                                  pathname.startsWith(child.href) &&
                                    "bg-[#fff8e8] font-semibold text-[#B88A28]",
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
              </div>

              <div className="border-t border-[#eadfca] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-2">
                  {siteSocialLinks.map((item) => {
                    const Icon = socialIconMap[item.title as keyof typeof socialIconMap];

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          item.href.startsWith("http") ? "noopener noreferrer" : undefined
                        }
                        aria-label={item.title}
                        className="inline-flex size-11 items-center justify-center rounded-full border border-[#eadfca] bg-white text-lg text-[#071225] shadow-sm hover:border-[#C49A3A]/70 hover:bg-[#C49A3A] hover:text-[#071225]"
                        onClick={closeMenu}
                      >
                        <Icon aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>

                {siteAppointmentLink ? (
                  <Link
                    href={siteAppointmentLink.href}
                    className="site-btn-motion mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C49A3A] px-5 text-sm font-bold text-white shadow-lg shadow-[#C49A3A]/25 hover:bg-[#B88A28]"
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

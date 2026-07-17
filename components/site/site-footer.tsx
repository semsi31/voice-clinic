"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { Reveal } from "@/components/site/motion/reveal";
import { SiteIcon, type SiteIconName } from "@/components/site/site-icon";
import { siteServiceLinks, siteSocialLinks } from "@/components/site/site-navigation";
import {
  FOOTER_DURATION_MS,
  getFooterRevealDelay,
  type FooterRevealColumn,
} from "@/lib/site-motion";

function subscribeToMobileFooter(cb: () => void) {
  const mediaQuery = window.matchMedia("(max-width: 767px)");
  mediaQuery.addEventListener("change", cb);

  return () => {
    mediaQuery.removeEventListener("change", cb);
  };
}

function getMobileFooterSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getServerFooterSnapshot() {
  return false;
}

function FooterReveal({
  column,
  variant = "fade-up-compact",
  children,
}: {
  column: FooterRevealColumn;
  variant?: "fade-up-compact" | "fade";
  children: ReactNode;
}) {
  const isMobile = useSyncExternalStore(
    subscribeToMobileFooter,
    getMobileFooterSnapshot,
    getServerFooterSnapshot,
  );

  return (
    <Reveal
      variant={variant}
      delay={getFooterRevealDelay(column, { mobile: isMobile })}
      duration={FOOTER_DURATION_MS}
      once
    >
      {children}
    </Reveal>
  );
}

export function SiteFooter() {
  const corporateLinks = [
    { title: "Ana Sayfa", href: "/" },
    { title: "Kurumsal", href: "/kurumsal" },
    { title: "Hizmetlerimiz", href: "/hizmetlerimiz" },
    { title: "İşitme Cihazları", href: "/isitme-cihazlari" },
    { title: "Teknik Servis", href: "/teknik-servis" },
    { title: "Blog", href: "/blog" },
    { title: "İletişim", href: "/iletisim" },
  ];

  const legalLinks = [
    { title: "KVKK ve Gizlilik", href: "/kvkk-gizlilik" },
    { title: "Çerez Politikası", href: "/cerez-politikasi" },
    { title: "Site Haritası", href: "/sitemap.xml" },
  ];

  const contactItems: {
    label: string;
    value: string;
    icon: SiteIconName;
    href?: string;
  }[] = [
    {
      label: "Telefon",
      value: "0 532 217 31 58",
      icon: "phone",
      href: "tel:+905322173158",
    },
    {
      label: "E-posta",
      value: "gdeniz5831@gmail.com",
      icon: "mail",
      href: "mailto:gdeniz5831@gmail.com",
    },
    {
      label: "Çalışma saatleri",
      value: "Pazartesi - Cumartesi 09:00 - 18:00",
      icon: "clock",
    },
    {
      label: "Adres",
      value:
        "Akasya Mh. 186. Sk. A Blok No:4 İç Kapı 6, Akıllı Plaza, Adliye yanı Kuponpark üzeri, Antakya / HATAY",
      icon: "map-pin",
    },
  ];

  const socialLinks = siteSocialLinks.map((item) => ({
    ...item,
    icon:
      item.title === "Instagram"
        ? FaInstagram
        : item.title === "WhatsApp"
          ? FaWhatsapp
          : FaFacebookF,
  }));

  return (
    <footer className="relative overflow-hidden bg-[#071225] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(184,138,40,0.11),transparent_28%),linear-gradient(135deg,#071225_0%,#0b1d36_52%,#071225_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(120deg,rgba(255,255,255,0.5)_0_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative h-px bg-gradient-to-r from-transparent via-[color:var(--site-gold-dark)]/55 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr] lg:px-8">
        <FooterReveal column="brand">
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex size-16 items-center justify-center rounded-2xl border border-[color:var(--site-gold-dark)]/35 bg-white/7 shadow-lg shadow-black/10 backdrop-blur"
              aria-label="Ana sayfa"
            >
              <Image
                src="/images/voice-logo.png"
                alt="Voice Klinik İşitme Merkezi"
                width={645}
                height={823}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="max-w-sm text-sm leading-7 text-white/74">
              Voice Klinik, işitme cihazı danışmanlığı, uygulama, teknik servis ve
              satış sonrası destek süreçlerinde güvenilir çözümler sunar.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={item.title}
                    className="site-footer-social inline-flex size-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-base text-white/78 shadow-sm shadow-black/10 backdrop-blur"
                  >
                    <Icon aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </FooterReveal>

        <FooterReveal column="services">
          <div>
            <h2 className="site-footer-heading text-xs font-bold uppercase tracking-[0.22em]">
              Hizmetlerimiz
            </h2>
            <nav className="mt-5 grid gap-2.5 sm:gap-3" aria-label="Footer hizmetler menüsü">
              {siteServiceLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="site-footer-link text-sm font-medium leading-6 text-white/74"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </FooterReveal>

        <FooterReveal column="quickLinks">
          <div>
            <h2 className="site-footer-heading text-xs font-bold uppercase tracking-[0.22em]">
              Hızlı Linkler
            </h2>
            <nav className="mt-5 grid gap-2.5 sm:gap-3" aria-label="Footer kurumsal menüsü">
              {corporateLinks.map((item) => (
                <Link
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  className="site-footer-link text-sm font-medium leading-6 text-white/74"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </FooterReveal>

        <FooterReveal column="contact">
          <div>
            <h2 className="site-footer-heading text-xs font-bold uppercase tracking-[0.22em]">
              İletişim
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/78">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="site-footer-icon mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border bg-white/6 shadow-sm shadow-black/10 backdrop-blur">
                    <SiteIcon name={item.icon} className="size-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-white/54">
                      {item.label}
                    </span>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="site-footer-contact-link mt-0.5 block text-sm font-medium text-white/82"
                      >
                        {item.value}
                      </Link>
                    ) : (
                      <span className="mt-0.5 block text-sm font-medium text-white/82">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FooterReveal>
      </div>

      <FooterReveal column="legal" variant="fade">
        <div className="relative border-t border-white/10 px-4 py-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs font-medium text-white/58 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Voice İşitme Merkezi. Tüm hakları saklıdır.</p>
            <nav className="flex flex-wrap gap-4" aria-label="Yasal bağlantılar">
              {legalLinks.map((item) => (
                <Link
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  className="site-footer-legal-link"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </FooterReveal>
    </footer>
  );
}
